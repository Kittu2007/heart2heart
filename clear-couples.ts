import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { adminDb } from './lib/firebase/admin-db';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function clearCouples() {
  console.log('Starting clear couples process...');

  // 1. Supabase Profiles
  console.log('Clearing couple_id from Supabase profiles...');
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ couple_id: null })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (profileError) console.error('Supabase profile error:', profileError);

  // 2. Supabase Couples
  console.log('Deleting all Supabase couples...');
  const { error: coupleError } = await supabaseAdmin
    .from('couples')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (coupleError) console.error('Supabase couple error:', coupleError);

  // 3. Firestore Profiles
  console.log('Clearing coupleId from Firestore profiles...');
  const profilesSnap = await adminDb.collection('profiles').get();
  const profileBatch = adminDb.batch();
  profilesSnap.docs.forEach(doc => {
    profileBatch.update(doc.ref, { coupleId: null, inviteCode: FieldValue.delete() });
  });
  await profileBatch.commit();

  // 4. Firestore Couples
  console.log('Deleting all Firestore couples...');
  const couplesSnap = await adminDb.collection('couples').get();
  const coupleBatch = adminDb.batch();
  couplesSnap.docs.forEach(doc => {
    coupleBatch.delete(doc.ref);
  });
  await coupleBatch.commit();

  console.log('Finished clearing couples!');
  process.exit(0);
}

clearCouples().catch(console.error);
