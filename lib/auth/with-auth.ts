import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../supabase/admin';
import { verifyFirebaseToken } from './verify-token';

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
  uid: string;
  name: string;
  coupleId: string | null;
  onboardingDone: boolean;
  comfortLevel: number;
};

export async function getAuthUser(req: NextRequest): Promise<UserContext> {
  const result = await verifyFirebaseToken(req);
  
  if (!result.decoded) {
    console.error(`[Auth] Verification failed for ${req.url}: ${result.error}`);
    // Provide the error detail in the message so the frontend can display it
    throw new AuthError(result.error || 'Unauthorized: Invalid token', result.code || 401);
  }

  const decodedToken = result.decoded;
  const firebaseUid = decodedToken.uid;

  const query = supabaseAdmin.from('profiles') as any;
  let { data: profile, error } = await query
    .select('id, name, couple_id, onboarding_done, comfort_level')
    .eq('id', firebaseUid)
    .single();

  // PERMANENT FIX: Auto-create profile if missing
  if (error && error.code === 'PGRST116' || !profile) {
    console.log(`[Auth] Profile missing for ${firebaseUid}, auto-creating...`);
    const { data: newProfile, error: createError } = await query
      .insert({
        id: firebaseUid,
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        avatar_url: decodedToken.picture || null,
        onboarding_done: false,
        comfort_level: 3,
      })
      .select('id, name, couple_id, onboarding_done, comfort_level')
      .single();

    if (createError) {
      console.error('[Auth] Failed to auto-create profile:', createError);
      throw new AuthError('Failed to initialize user profile', 500);
    }
    profile = newProfile;
  } else if (error) {
    console.error('[Auth] Database error:', error);
    throw new AuthError('Database connection error', 500);
  }

  return {
    uid: profile.id,
    name: profile.name,
    coupleId: profile.couple_id,
    onboardingDone: profile.onboarding_done,
    comfortLevel: profile.comfort_level,
  };
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
        return Response.json({ error: error.message }, { status: error.statusCode });
      }
      console.error('[withAuth] Unexpected error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
