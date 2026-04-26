import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function clearSupabase() {
  console.log('Starting Supabase cleanup...');

  // 1. Clear profile links
  console.log('Clearing couple_id from all profiles...');
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ couple_id: null })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

  if (profileError) {
    console.error('Error updating profiles:', profileError);
  } else {
    console.log('Successfully cleared profiles.');
  }

  // 2. Delete all couples
  console.log('Deleting all couple records...');
  const { error: coupleError } = await supabaseAdmin
    .from('couples')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (coupleError) {
    console.error('Error deleting couples:', coupleError);
  } else {
    console.log('Successfully deleted couples.');
  }

  console.log('Supabase cleanup finished.');
  process.exit(0);
}

clearSupabase().catch(console.error);
