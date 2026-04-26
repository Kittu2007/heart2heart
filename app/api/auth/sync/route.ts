import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyFirebaseToken } from '@/lib/auth/verify-token';
import { syncFirebaseUserToSupabase } from '@/lib/auth/sync';
import { syncProfileToFirestore } from '@/lib/auth/firestore-sync';

const SyncSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  avatarUrl: z.string().url().nullable().optional(),
});

export async function POST(req: NextRequest) {
  // Verify Firebase token
  const result = await verifyFirebaseToken(req);
  if (!result.decoded) {
    return Response.json({ error: result.error || 'Unauthorized: Invalid or missing token' }, { status: result.code || 401 });
  }

  const firebaseUid = result.decoded.uid;

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

  const { name, avatarUrl } = parsed.data;
  const { profile, error } = await syncFirebaseUserToSupabase(firebaseUid, {
    name,
    avatarUrl: avatarUrl ?? null,
  });

  if (error || !profile) {
    return Response.json({ error: 'Failed to sync user profile', detail: JSON.parse(JSON.stringify(error ?? 'no profile returned')) }, { status: 500 });
  }

  // Sync to Firestore for real-time frontend features
  await syncProfileToFirestore(firebaseUid, { 
    name: profile.name,
    coupleId: profile.couple_id,
    onboardingDone: profile.onboarding_done
  });

  return Response.json({
    profile: {
      id: profile.id,
      name: profile.name,
      avatarUrl: profile.avatar_url,
      coupleId: profile.couple_id,
      onboardingDone: profile.onboarding_done,
      createdAt: profile.created_at,
    },
  });
}
