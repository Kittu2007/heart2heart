import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, UserContext } from '@/lib/auth/with-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function getUniqueInviteCode(): Promise<string> {
  const query = supabaseAdmin.from('couples') as any;
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const { data } = await query.select('id').eq('invite_code', code).single();
    if (!data) return code; // not taken
  }
  throw new Error('Could not generate unique invite code after 10 attempts');
}

// POST /api/couples — create a new couple
export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  if (user.coupleId) {
    return Response.json({ error: 'You are already part of a couple' }, { status: 409 });
  }

  try {
    const inviteCode = await getUniqueInviteCode();

    const couplesQuery = supabaseAdmin.from('couples') as any;
    const { data: couple, error: createError } = await couplesQuery
      .insert({
        invite_code: inviteCode,
        partner_a_id: user.uid,
        status: 'pending',
      })
      .select('id, invite_code, status, created_at')
      .single();

    if (createError) throw createError;

    // Link profile to this couple
    const profilesQuery = supabaseAdmin.from('profiles') as any;
    const { error: profileError } = await profilesQuery
      .update({ couple_id: couple.id })
      .eq('id', user.uid);

    if (profileError) throw profileError;

    return Response.json({
      couple: {
        id: couple.id,
        inviteCode: couple.invite_code,
        status: couple.status,
        createdAt: couple.created_at,
        partnerAId: user.uid,
        partnerBId: null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create couple error:', error);
    return Response.json({ error: 'Failed to create couple' }, { status: 500 });
  }
});

// GET /api/couples — get current user's couple info
export const GET = withAuth(async (_req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return Response.json({ couple: null }, { status: 200 });
  }

  try {
    const query = supabaseAdmin.from('couples') as any;
    const { data: couple, error } = await query
      .select(`
        id, invite_code, status, created_at,
        partner_a:profiles!couples_partner_a_id_fkey (id, name, avatar_url, onboarding_done),
        partner_b:profiles!couples_partner_b_id_fkey (id, name, avatar_url, onboarding_done)
      `)
      .eq('id', user.coupleId)
      .single();

    if (error) throw error;

    return Response.json({ couple });
  } catch (error) {
    console.error('Get couple error:', error);
    return Response.json({ error: 'Failed to fetch couple' }, { status: 500 });
  }
});
