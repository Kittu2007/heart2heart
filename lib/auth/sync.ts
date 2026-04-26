import { supabaseAdmin } from '../supabase/admin';
import type { Database } from '../supabase/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

export async function syncFirebaseUserToSupabase(
  firebaseUid: string,
  userData: {
    name: string;
    avatarUrl?: string | null;
  }
): Promise<{ profile: Profile | null; error: unknown }> {
  console.log('[SYNC] input uid:', firebaseUid, '| name:', userData.name);

  const payload = {
    id: firebaseUid,
    name: userData.name,
    avatar_url: userData.avatarUrl ?? null,
    onboarding_done: false,
    comfort_level: 3,
    is_admin: false,
  } as ProfileInsert;

  console.log('[SYNC] upsert payload:', JSON.stringify(payload));

  const query = supabaseAdmin.from('profiles') as any;
  const { data: profile, error } = await query
    .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
    .select()
    .single();

  if (error) {
    console.error('[SYNC ERROR] Supabase error:', JSON.stringify(error));
    return { profile: null, error };
  }

  console.log('[SYNC] success, profile id:', profile?.id);
  return { profile, error: null };
}

export async function ensureProfileExists(
  firebaseUid: string,
  name: string
): Promise<{ exists: boolean; error: Error | null }> {
  try {
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', firebaseUid)
      .single();

    if (existing) return { exists: true, error: null };

    const insertQuery = supabaseAdmin.from('profiles') as any;
    const { error } = await insertQuery.insert({
      id: firebaseUid,
      name,
    } as ProfileInsert);

    if (error) throw error;
    return { exists: true, error: null };
  } catch (error) {
    return { exists: false, error: error as Error };
  }
}
