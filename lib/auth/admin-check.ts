import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../supabase/admin';
import { verifyFirebaseToken } from './verify-token';

export class AdminError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

export async function verifyAdmin(req: NextRequest) {
  const decodedToken = await verifyFirebaseToken(req);
  if (!decodedToken) throw new AdminError('Unauthorized: Invalid or missing token', 401);

  const firebaseUid = decodedToken.uid;

  const query = supabaseAdmin.from('profiles') as any;
  const { data: profile, error } = await query
    .select('id, name, is_admin, created_at')
    .eq('id', firebaseUid)
    .single();

  if (error || !profile) throw new AdminError('Unauthorized: User not found', 401);
  if (!profile.is_admin) throw new AdminError('Forbidden: Admin access required', 403);

  return {
    uid: profile.id as string,
    name: profile.name as string,
    isAdmin: profile.is_admin as boolean,
    createdAt: profile.created_at as string,
  };
}

export type AdminContext = {
  uid: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
};

export function withAdminAuth(
  handler: (
    req: NextRequest,
    admin: AdminContext,
    ctx?: { params: Promise<Record<string, string>> }
  ) => Promise<Response>
) {
  return async (
    req: NextRequest,
    ctx?: { params: Promise<Record<string, string>> }
  ): Promise<Response> => {
    try {
      const admin = await verifyAdmin(req);
      return await handler(req, admin, ctx);
    } catch (error) {
      if (error instanceof AdminError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }
      console.error('[withAdminAuth] Unexpected error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

export async function isUserAdmin(firebaseUid: string): Promise<boolean> {
  const query = supabaseAdmin.from('profiles') as any;
  const { data } = await query.select('is_admin').eq('id', firebaseUid).single();
  return data?.is_admin === true;
}
