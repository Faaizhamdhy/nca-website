import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  // 1. Verify cron secret if provided
  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const syncId = Date.now().toString();
  let successCount = 0;
  let failedCount = 0;

  try {
    // 2. Fetch verif.json
    const verifRes = await fetch('https://raw.githubusercontent.com/nuells404/ells-clausius/refs/heads/main/verif.json');
    if (!verifRes.ok) throw new Error('Failed to fetch verif.json');
    
    const verifData = await verifRes.json();
    let usernames = [];

    // Extract usernames from the structure
    for (const key in verifData) {
      if (Array.isArray(verifData[key])) {
        for (const member of verifData[key]) {
          if (member.username) {
            usernames.push(member.username);
          }
        }
      }
    }

    // Remove duplicates
    usernames = [...new Set(usernames)];

    // 3. Loop and fetch TikTok stats
    for (const username of usernames) {
      try {
        await delay(300); // Rate limiting
        
        const stalkRes = await fetch(`https://raaenceaaa.vercel.app/stalk/tiktok?username=${username}`);
        if (!stalkRes.ok) throw new Error(`Failed to stalk ${username}`);
        
        const stalkData = await stalkRes.json();
        
        // Ensure data is valid
        if (stalkData && stalkData.status === true && stalkData.data) {
          const data = stalkData.data;
          const stats = data.stats || {};
          const avatar = data.avatar || {};

          const memberData = {
            username: data.username,
            nickname: data.nickname,
            avatar_url: avatar.large || avatar.medium || avatar.thumb || '',
            followers: stats.followers || 0,
            following: stats.following || 0,
            likes: stats.likes || 0,
            video_count: stats.videos || 0,
            tiktok_url: `https://www.tiktok.com/@${data.username}`,
            synced_at: new Date().toISOString()
          };

          // 4. Upsert to Supabase
          const { error } = await supabase
            .from('members')
            .upsert(memberData, { onConflict: 'username' });

          if (error) {
            console.error(`Supabase error for ${username}:`, error);
            failedCount++;
          } else {
            successCount++;
          }
        } else {
           failedCount++;
        }
      } catch (err) {
        console.error(`Error processing ${username}:`, err);
        failedCount++;
      }
    }

    // 5. Log to sync_logs
    await supabase.from('sync_logs').insert({
      status: 'success',
      message: `Synced ${successCount} members, ${failedCount} failed.`
    });

    res.status(200).json({ status: 'ok', successCount, failedCount });
  } catch (error) {
    console.error('Sync failed:', error);
    
    // Log failure
    await supabase.from('sync_logs').insert({
      status: 'failed',
      message: error.message
    });

    res.status(500).json({ error: 'Internal Server Error' });
  }
}
