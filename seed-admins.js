import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const adminsData = [
  { nickname: '1v.rexyz', division: 'Leader Admin', order_index: 1 },
  { nickname: 'heinhavertomioka', division: 'Co Leader', order_index: 2 },
  { nickname: 'rwbyygy', division: 'Admin All Gen', order_index: 3 },
  { nickname: 'inzyy..1', division: 'Admin Gen 3', order_index: 4 },
  { nickname: 'inifuzzy', division: 'Admin Desain · Gen 1', order_index: 5 },
  { nickname: 'fyunn83', division: 'Admin Meme · Gen 3', order_index: 6 },
  { nickname: 'shima_sigma', division: 'Admin Gen 1', order_index: 7 },
  { nickname: 'lay.pemulain', division: 'Admin Gen 2', order_index: 8 },
  { nickname: 'elainacelestelia', division: 'Admin Bot', order_index: 9 },
  { nickname: 'rikkaahere_', division: 'Admin', order_index: 10 },
  { nickname: 'sayakiyoo', division: 'Admin Gen 2', order_index: 11 },
  { nickname: 'awkward5511', division: 'Admin Gen 1', order_index: 12 },
  { nickname: 'nino.yogiri_', division: 'Admin Gen 1', order_index: 13 },
  { nickname: 'edostecu_1', division: 'Admin Gen 3', order_index: 14 },
  { nickname: 'naellcortisoll', division: 'Admin Gen 2', order_index: 15 },
  { nickname: 'aki_midoriya1', division: 'Admin Gen 2', order_index: 16 },
  { nickname: '1v_ictoria', division: 'Admin Gen 2', order_index: 17 },
  { nickname: '_xlenzey', division: 'Admin Gen 3', order_index: 18 },
  { nickname: 'inizarrjirrr', division: 'Admin Gen 1', order_index: 19 }
];

async function seedAdmins() {
  try {
    const { data: members, error: fetchError } = await supabase
      .from('members')
      .select('username, nickname, avatar_url');

    if (fetchError) {
       console.error("Error fetching members:", fetchError);
       return;
    }

    const memberMap = {};
    if (members) {
        members.forEach(m => {
            memberMap[m.username] = m;
        });
    }

    const recordsToInsert = adminsData.map(admin => {
        const memberInfo = memberMap[admin.nickname];
        return {
            nickname: admin.nickname,
            full_name: (memberInfo && memberInfo.nickname) ? memberInfo.nickname : admin.nickname,
            division: admin.division,
            avatar_url: memberInfo ? memberInfo.avatar_url : null,
            order_index: admin.order_index
        };
    });

    // Clear existing data just in case
    await supabase.from('admins').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { data, error } = await supabase
      .from('admins')
      .insert(recordsToInsert)
      .select();

    if (error) {
      console.error('Error inserting admins:', error);
    } else {
      console.log('Successfully inserted admins:', data.length);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

seedAdmins();
