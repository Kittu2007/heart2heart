import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyFirebaseToken } from '@/lib/auth/verify-token';
import { syncFirebaseUserToSupabase } from '@/lib/auth/sync';
import { syncProfileToFirestore } from '@/lib/auth/firestore-sync';
import { toDbId } from '@/lib/auth/id-mapper';

const SyncSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  avatarUrl: z.string().url().nullable().optional(),
  onboardingData: z.object({
    loveLanguage: z.string().nullable().optional(),
    communicationStyle: z.string().nullable().optional(),
    comfortLevel: z.number().optional(),
    onboardingDone: z.boolean().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  // ── Step 1: Verify Firebase token ────────────────────────────────────────
  const result = await verifyFirebaseToken(req);
  if (!result.decoded) {
    return Response.json(
      { error: result.error || 'Unauthorized: Invalid or missing token' },
      { status: result.code || 401 }
    );
  }

  const firebaseUid = result.decoded.uid;

  // Pre-compute the mapped UUID so we can include it in every response/log
  let postgresUuid: string;
  try {
    postgresUuid = toDbId(firebaseUid);
  } catch (mapErr: any) {
    console.error('[SYNC] UID mapping failed:', firebaseUid, mapErr?.message);
    return Response.json(
      { error: 'UID mapping failed', detail: mapErr?.message, firebase_uid: firebaseUid },
      { status: 500 }
    );
  }

  console.log('[SYNC] Login sync → firebase_uid:', firebaseUid, '| postgres_uuid:', postgresUuid);

  // ── Step 2: Parse + validate body ────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SyncSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { name, avatarUrl, onboardingData } = parsed.data;

  // ── Step 3: Upsert profile in Supabase (BLOCKING — must succeed) ──────────
  const { profile, error: syncError, detail: syncDetail } = await syncFirebaseUserToSupabase(
    firebaseUid,
    {
      name,
      avatarUrl: avatarUrl ?? null,
      ...onboardingData,
    }
  );

  if (syncError || !profile) {
    const errMsg = syncDetail || (syncError instanceof Error ? syncError.message : JSON.stringify(syncError));
    console.error(
      '[SYNC] FATAL — could not confirm Supabase profile row.',
      '| firebase_uid:', firebaseUid,
      '| postgres_uuid:', postgresUuid,
      '| reason:', errMsg
    );
    return Response.json(
      {
        error: 'Failed to sync user profile to Supabase. Cannot proceed to dashboard.',
        detail: errMsg,
        // Expose the mapping for client-side debugging
        debug: { firebase_uid: firebaseUid, postgres_uuid: postgresUuid },
      },
      { status: 500 }
    );
  }

  console.log(
    '[SYNC] ✓ Supabase profile confirmed.',
    '| firebase_uid:', firebaseUid,
    '| postgres_uuid:', profile.id,
    '| couple_id:', profile.couple_id ?? 'none',
    '| onboarding_done:', profile.onboarding_done
  );

  // ── Step 4: Sync to Firestore (non-blocking, best-effort) ────────────────
  try {
    await syncProfileToFirestore(firebaseUid, {
      name: profile.name,
      coupleId: profile.couple_id,
      onboardingDone: profile.onboarding_done,
      dbId: profile.id,
      comfortLevel: profile.comfort_level,
    });
  } catch (fsErr) {
    // Firestore sync is best-effort — log but do NOT fail the request
    console.error('[SYNC] Firestore sync failed (non-fatal):', fsErr);
  }

  // ── Step 5: Return confirmed profile + uid mapping ────────────────────────
  return Response.json({
    profile: {
      id: profile.id,
      name: profile.name,
      avatarUrl: profile.avatar_url,
      coupleId: profile.couple_id,
      onboardingDone: profile.onboarding_done,
      createdAt: profile.created_at,
    },
    // Mapping exposed for client debugging — safe to log, not sensitive
    debug: {
      firebase_uid: firebaseUid,
      postgres_uuid: profile.id,
    },
  });
}
