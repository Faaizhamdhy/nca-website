/**
 * assign-generations.js
 * Reads verif.json from GitHub and updates the `generation` column
 * in Supabase `members` table based on which WhatsApp group they belong to.
 *
 * Run with: node api/assign-generations.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ─── Load env vars from .env.local ────────────────────────
import { config } from 'dotenv';
config({ path: '.env.local' });

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;
const VERIF_URL        = 'https://raw.githubusercontent.com/nuells404/ells-clausius/refs/heads/main/verif.json';

// Gen mapping: WhatsApp group ID → generation number
const GEN_MAP = {
  '120363405649342341@g.us': 1,
  '120363411505832984@g.us': 2,
  '120363388553130947@g.us': 3,
};

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

  // Fetch verif.json from GitHub
  console.log('📥 Fetching verif.json from GitHub...');
  const res = await fetch(VERIF_URL);
  if (!res.ok) throw new Error(`Failed to fetch verif.json: ${res.status}`);
  const data = await res.json();

  // Build username → generation map (deduplicate: username may appear in multiple groups)
  const usernameToGen = {};
  for (const [groupId, members] of Object.entries(data)) {
    const gen = GEN_MAP[groupId];
    if (!gen) { console.warn(`⚠️  Unknown group: ${groupId}`); continue; }
    for (const member of members) {
      if (member.username) {
        // If already mapped to a lower gen, keep the lower gen (Gen 1 priority)
        if (!usernameToGen[member.username] || gen < usernameToGen[member.username]) {
          usernameToGen[member.username] = gen;
        }
      }
    }
  }

  const total = Object.keys(usernameToGen).length;
  console.log(`✅ Found ${total} unique usernames across all generations`);
  console.log('   Gen 1:', Object.values(usernameToGen).filter(g => g === 1).length);
  console.log('   Gen 2:', Object.values(usernameToGen).filter(g => g === 2).length);
  console.log('   Gen 3:', Object.values(usernameToGen).filter(g => g === 3).length);

  // Update Supabase in batches of 50
  const entries = Object.entries(usernameToGen);
  let updated = 0;
  let notFound = 0;

  for (let i = 0; i < entries.length; i += 50) {
    const batch = entries.slice(i, i + 50);
    for (const [username, generation] of batch) {
      const { data: rows, error } = await supabase
        .from('members')
        .update({ generation })
        .eq('username', username)
        .select('username');

      if (error) {
        console.error(`  ❌ Error updating ${username}:`, error.message);
      } else if (!rows || rows.length === 0) {
        notFound++;
        // console.log(`  ⚠️  Not in DB: ${username}`);
      } else {
        updated++;
        console.log(`  ✅ Gen ${generation} → ${username}`);
      }
    }
  }

  console.log('\n──────────────────────────────────');
  console.log(`✅ Updated  : ${updated} members`);
  console.log(`⚠️  Not found: ${notFound} (not in TikTok DB yet)`);
  console.log('──────────────────────────────────');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
