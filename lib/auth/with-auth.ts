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
  const firebaseUid = await verifyFirebaseToken(req);
  if (!firebaseUid) throw new AuthError('Unauthorized: Invalid or missing token', 401);

  const query = supabaseAdmin.from('profiles') as any;
  const { data: profile, error } = await query
    .select('id, name, couple_id, onboarding_done, comfort_level')
    .eq('id', firebaseUid)
    .single();

  if (error || !profile) throw new AuthError('User profile not found. Call /api/auth/sync first.', 404);

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
