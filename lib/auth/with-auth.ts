import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../supabase/admin';
import { verifyFirebaseToken } from './verify-token';
import { toDbId } from './id-mapper';

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export type UserContext = {
  uid: string;       // Original Firebase UID
  dbId: string;      // Mapped UUID for Supabase
  name: string;
  coupleId: string | null;
  onboardingDone: boolean;
  comfortLevel: number;
};

export async function getAuthUser(req: NextRequest): Promise<UserContext> {
  const result = await verifyFirebaseToken(req);
  
  if (!result.decoded) {
    console.error(`[Auth] Verification failed for ${req.url}: ${result.error}`);
    throw new AuthError(result.error || 'Unauthorized: Invalid token', result.code || 401);
  }

  const decodedToken = result.decoded;
  const firebaseUid = decodedToken.uid;
  const dbId = toDbId(firebaseUid);

  // 1. Try to fetch existing profile using mapped dbId
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, couple_id, onboarding_done, comfort_level')
    .eq('id', dbId)
    .maybeSingle();

  if (error) {
    console.error('[Auth] Database error:', error);
    throw new AuthError('Database connection error', 500);
  }

  if (profile) {
    return {
      uid: firebaseUid,
      dbId: profile.id,
      name: profile.name,
      coupleId: profile.couple_id,
      onboardingDone: profile.onboarding_done,
      comfortLevel: profile.comfort_level,
    };
  }

  // 2. Profile missing, auto-create it using mapped dbId
  console.log(`[Auth] Profile missing for ${firebaseUid} (DB ID: ${dbId}), auto-creating...`);
  
  const insertPayload = {
    id: dbId,
    name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
    avatar_url: decodedToken.picture || null,
    onboarding_done: false,
    comfort_level: 3,
  };

  const { data: newProfile, error: upsertError } = await supabaseAdmin
    .from('profiles')
    .upsert(insertPayload, { onConflict: 'id', ignoreDuplicates: true })
    .select('id, name, couple_id, onboarding_done, comfort_level')
    .maybeSingle();

  if (newProfile) {
    return {
      uid: firebaseUid,
      dbId: newProfile.id,
      name: newProfile.name,
      coupleId: newProfile.couple_id,
      onboardingDone: newProfile.onboarding_done,
      comfortLevel: newProfile.comfort_level,
    };
  }

  // Final fallback fetch
  const { data: finalProfile, error: finalError } = await supabaseAdmin
    .from('profiles')
    .select('id, name, couple_id, onboarding_done, comfort_level')
    .eq('id', dbId)
    .maybeSingle();

  if (finalProfile) {
    return {
      uid: firebaseUid,
      dbId: finalProfile.id,
      name: finalProfile.name,
      coupleId: finalProfile.couple_id,
      onboardingDone: finalProfile.onboarding_done,
      comfortLevel: finalProfile.comfort_level,
    };
  }

  const detail = (upsertError?.message || finalError?.message || 'Unknown DB error');
  console.error(`[Auth] Final profile initialization failure for ${firebaseUid}: ${detail}`);
  throw new AuthError(`Failed to initialize user profile: ${detail}`, 500);
}

export function withAuth(
  handler: (req: NextRequest, user: UserContext) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const user = await getAuthUser(req);
      return await handler(req, user);
    } catch (error) {
      if (error instanceof AuthError) {
        return Response.json({ 
          error: error.message,
          code: error.statusCode 
        }, { status: error.statusCode });
      }
      console.error('[withAuth] Unexpected error:', error);
      return Response.json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }, { status: 500 });
    }
  };
}
