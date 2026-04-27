import { supabaseAdmin } from './admin';
import { toDbId } from '../auth/id-mapper';

/**
 * Fetches a profile by its Firebase UID.
 */
export async function getProfileByFirebaseUid(firebaseUid: string) {
  const dbId = toDbId(firebaseUid);
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', dbId)
    .single();

  if (error) {
    console.error('[getProfileByFirebaseUid] error:', error);
    return null;
  }
  return data;
}
