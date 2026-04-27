import { supabaseAdmin } from '../supabase/admin';
import type { Database } from '../supabase/database.types';
import { syncProfileToFirestore, syncCoupleToFirestore } from './firestore-sync';
import { toDbId } from './id-mapper';

type Profile = Database['public']['Tables']['profiles']['Row'];

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
): Promise<{ profile: Profile | null; error: unknown; detail?: string }> {
  try {
    const dbId = toDbId(firebaseUid);

    // ── Build upsert payload ─────────────────────────────────────────────
    const payload: Record<string, unknown> = {
      id: dbId,
      name: userData.name,
      avatar_url: userData.avatarUrl ?? null,
    };
    if (userData.onboardingDone !== undefined) payload.onboarding_done = userData.onboardingDone;
    if (userData.comfortLevel !== undefined) payload.comfort_level = userData.comfortLevel;

    // ── Attempt upsert ───────────────────────────────────────────────────
    const { data: upserted, error: upsertError } = await (supabaseAdmin.from('profiles') as any)
      .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
      .select()
      .maybeSingle();

    let profile: Profile | null = upserted ?? null;

    if (upsertError || !profile) {
      // Upsert failed — try a direct fetch as a recovery path
      // (covers the race where the row already exists but RLS blocked the write)
      console.warn(
        '[SYNC] Upsert error or empty response — attempting fetch fallback.',
        '| postgres_uuid:', dbId,
        '| error:', JSON.stringify(upsertError)
      );

      const { data: fetched, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', dbId)
        .maybeSingle();

      if (fetchError || !fetched) {
        // Neither upsert nor fetch worked — hard failure
        const detail = upsertError
          ? `Upsert failed: code=${upsertError.code} message=${upsertError.message}`
          : 'Upsert returned null and fetch found no row';
        console.error('[SYNC] HARD FAILURE — no Supabase profile row confirmed.', detail);
        return { profile: null, error: upsertError || new Error(detail), detail };
      }

      // Row exists (was created before / by another path) — accept it
      profile = fetched as Profile;
    }

    // ── Profile confirmed — sync auxiliary data ──────────────────────────
    await syncProfileToFirestore(firebaseUid, {
      name: userData.name,
      coupleId: profile.couple_id,
      onboardingDone: profile.onboarding_done,
      dbId,
      loveLanguage: userData.loveLanguage,
      communicationStyle: userData.communicationStyle,
      comfortLevel: userData.comfortLevel,
    });


    // ── Eager couple assignment if user has no couple ────────────────────
    if (!profile.couple_id) {
      try {
        await _assignOrCreateCouple(firebaseUid, dbId, profile);
      } catch (e) {
        // Non-fatal — user can create/join a couple manually
        console.error('[SYNC] Auto-couple assignment failed (non-fatal):', e);
      }
    }

    return { profile, error: null };
  } catch (err) {
    console.error('[SYNC] Uncaught error in syncFirebaseUserToSupabase:', err);
    return {
      profile: null,
      error: err,
      detail: err instanceof Error ? err.message : JSON.stringify(err),
    };
  }
}

/** Assigns an existing couple or creates a pending one for a new user. */
async function _assignOrCreateCouple(
  firebaseUid: string,
  dbId: string,
  profile: Profile
): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('couples')
    .select('id, invite_code, status, partner_a_id, partner_b_id')
    .or(`partner_a_id.eq.${dbId},partner_b_id.eq.${dbId}`)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from('profiles').update({ couple_id: existing.id }).eq('id', dbId);
    await Promise.all([
      syncProfileToFirestore(firebaseUid, { coupleId: existing.id, inviteCode: existing.invite_code }),
      syncCoupleToFirestore(existing.id, {
        inviteCode: existing.invite_code,
        partnerAId: existing.partner_a_id,
        partnerBId: existing.partner_b_id,
        status: existing.status,
      }),
    ]);
    return;
  }

  // Create a new pending couple
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data: newCouple } = await (supabaseAdmin.from('couples') as any)
    .insert({ partner_a_id: dbId, invite_code: inviteCode, status: 'pending' })
    .select()
    .single();

  if (newCouple) {
    await supabaseAdmin.from('profiles').update({ couple_id: newCouple.id }).eq('id', dbId);
    await Promise.all([
      syncProfileToFirestore(firebaseUid, { coupleId: newCouple.id, inviteCode: newCouple.invite_code }),
      syncCoupleToFirestore(newCouple.id, {
        inviteCode: newCouple.invite_code,
        partnerAId: newCouple.partner_a_id,
        status: 'pending',
      }),
    ]);
  }
}

export async function ensureProfileExists(
  firebaseUid: string,
  name: string
): Promise<{ exists: boolean; error: Error | null }> {
  try {
    const dbId = toDbId(firebaseUid);
    const { error } = await (supabaseAdmin.from('profiles') as any).upsert(
      { id: dbId, name },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (error) throw error;
    return { exists: true, error: null };
  } catch (error) {
    console.error('[ensureProfileExists] Error:', error);
    return { exists: false, error: error as Error };
  }
}
