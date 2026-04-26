import { supabaseAdmin } from '../supabase/admin';
import type { Database } from '../supabase/database.types';
import { syncProfileToFirestore, syncCoupleToFirestore } from './firestore-sync';
import { toDbId } from './id-mapper';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

export async function syncFirebaseUserToSupabase(
  firebaseUid: string,
  userData: {
    name: string;
    avatarUrl?: string | null;
    onboardingDone?: boolean;
    comfortLevel?: number;
    loveLanguage?: string | null;
    communicationStyle?: string | null;
  }
): Promise<{ profile: Profile | null; error: unknown }> {
  const dbId = toDbId(firebaseUid);
  console.log('[SYNC] firebase uid:', firebaseUid, '| dbId:', dbId, '| name:', userData.name);
  
  // Basic profile payload
  const payload: any = {
    id: dbId,
    name: userData.name,
    avatar_url: userData.avatarUrl ?? null,
  };

  // Add onboarding fields if provided
  if (userData.onboardingDone !== undefined) payload.onboarding_done = userData.onboardingDone;
  if (userData.comfortLevel !== undefined) payload.comfort_level = userData.comfortLevel;

  const query = supabaseAdmin.from('profiles') as any;
  const { data: profile, error } = await query
    .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
    .select()
    .maybeSingle();

  if (error || !profile) {
    console.error('[SYNC ERROR] Supabase error:', JSON.stringify(error));
    
    // Final fallback: try to fetch even if upsert errored
    const { data: retry } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', dbId)
      .maybeSingle();
      
    if (retry) {
      // Sync to Firestore using ORIGINAL firebaseUid for client compatibility
      await syncProfileToFirestore(firebaseUid, {
        name: userData.name,
        coupleId: (retry as any).couple_id,
        onboardingDone: (retry as any).onboarding_done,
        dbId: dbId,
        inviteCode: (retry as any).invite_code || undefined,
        loveLanguage: userData.loveLanguage,
        communicationStyle: userData.communicationStyle
      });
      return { profile: retry as Profile, error: null };
    }
    
    return { profile: null, error: error || new Error('Failed to fetch or create profile') };
  }

  // Sync to Firestore using ORIGINAL firebaseUid
  await syncProfileToFirestore(firebaseUid, {
    name: userData.name,
    coupleId: profile.couple_id,
    onboardingDone: profile.onboarding_done,
    dbId: dbId,
    inviteCode: (profile as any).invite_code || undefined,
    loveLanguage: userData.loveLanguage,
    communicationStyle: userData.communicationStyle,
    comfortLevel: userData.comfortLevel
  });

  console.log('[SYNC] success, profile dbId:', profile?.id);

  // EAGER CODE GENERATION: Assign a permanent code if they don't have one
  if (profile && !profile.couple_id) {
    console.log('[SYNC] No coupleId, checking for existing or creating new...');
    try {
      const { data: existing } = await supabaseAdmin
        .from('couples')
        .select('id, invite_code, status, partner_a_id, partner_b_id')
        .or(`partner_a_id.eq.${dbId},partner_b_id.eq.${dbId}`)
        .maybeSingle();

      if (existing) {
        console.log('[SYNC] Found existing couple record, linking to profile');
        const { data: updated } = await supabaseAdmin
          .from('profiles')
          .update({ couple_id: existing.id })
          .eq('id', dbId)
          .select()
          .single();
        if (updated) profile.couple_id = updated.couple_id;

        await Promise.all([
          syncProfileToFirestore(firebaseUid, {
            coupleId: existing.id,
            inviteCode: existing.invite_code
          }),
          syncCoupleToFirestore(existing.id, {
            inviteCode: existing.invite_code,
            partnerAId: existing.partner_a_id,
            partnerBId: existing.partner_b_id,
            status: existing.status
          })
        ]);
      } else {
        console.log('[SYNC] Creating new permanent invite code...');
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: newCouple } = await (supabaseAdmin.from('couples') as any)
          .insert({
            partner_a_id: dbId,
            invite_code: inviteCode,
            status: 'pending'
          })
          .select()
          .single();

        if (newCouple) {
          const { data: updatedProfile } = await supabaseAdmin
            .from('profiles')
            .update({ couple_id: newCouple.id })
            .eq('id', dbId)
            .select()
            .single();
          if (updatedProfile) {
            profile.couple_id = updatedProfile.couple_id;
            // Sync updated profile with code
            await syncProfileToFirestore(firebaseUid, {
              coupleId: newCouple.id,
              inviteCode: newCouple.invite_code
            });
          }

          await syncCoupleToFirestore(newCouple.id, {
            inviteCode: newCouple.invite_code,
            partnerAId: newCouple.partner_a_id,
            status: 'pending'
          });
        }
      }
    } catch (e) {
      console.error('[SYNC] Failed to auto-assign code:', e);
    }
  }

  return { profile, error: null };
}

export async function ensureProfileExists(
  firebaseUid: string,
  name: string
): Promise<{ exists: boolean; error: Error | null }> {
  try {
    const dbId = toDbId(firebaseUid);
    const insertQuery = supabaseAdmin.from('profiles') as any;
    const { error } = await insertQuery.upsert({
      id: dbId,
      name,
    }, { onConflict: 'id', ignoreDuplicates: true });

    if (error) throw error;
    return { exists: true, error: null };
  } catch (error) {
    console.error('[ensureProfileExists] Error:', error);
    return { exists: false, error: error as Error };
  }
}
