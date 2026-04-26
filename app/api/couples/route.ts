import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, UserContext } from '@/lib/auth/with-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncProfileToFirestore, syncCoupleToFirestore } from '@/lib/auth/firestore-sync';

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

// POST /api/couples — create a new couple or return existing pending one
  // If the user has a coupleId, check its status before erroring
  if (user.coupleId) {
    const { data: couple } = await supabaseAdmin
      .from('couples')
      .select('status')
      .eq('id', user.coupleId)
      .maybeSingle();
      
    if (couple?.status === 'active') {
      return Response.json({ error: 'You are already part of a couple' }, { status: 409 });
    }
    // If it's pending, we'll continue and return it in the logic below
  }

  try {
    const couplesQuery = supabaseAdmin.from('couples') as any;

    // 1. Check if we already have a pending couple (fix for potential race conditions/orphaned rows)
    const { data: existing } = await couplesQuery
      .select('id, invite_code, status, created_at')
      .eq('partner_a_id', user.dbId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      // Ensure profile is linked (self-healing)
      await (supabaseAdmin.from('profiles') as any)
        .update({ couple_id: existing.id })
        .eq('id', user.dbId);

      // Sync to Firestore
      await Promise.all([
        syncProfileToFirestore(user.uid, { coupleId: existing.id, dbId: user.dbId }),
        syncCoupleToFirestore(existing.id, { 
          inviteCode: existing.invite_code, 
          partnerAId: user.dbId,
          status: existing.status 
        })
      ]);

      return Response.json({
        couple: {
          id: existing.id,
          inviteCode: existing.invite_code,
          status: existing.status,
          createdAt: existing.created_at,
          partnerAId: user.dbId,
          partnerBId: null,
        },
      }, { status: 200 });
    }

    // 2. Generate unique code and insert
    const inviteCode = await getUniqueInviteCode();
    const { data: couple, error: createError } = await couplesQuery
      .insert({
        invite_code: inviteCode,
        partner_a_id: user.dbId,
        status: 'pending',
      })
      .select('id, invite_code, status, created_at')
      .single();

    if (createError) throw createError;

    // 3. Link profile to this couple
    const profilesQuery = supabaseAdmin.from('profiles') as any;
    const { error: profileError } = await profilesQuery
      .update({ couple_id: couple.id })
      .eq('id', user.dbId);

    if (profileError) {
      console.error('[COUPLES] Profile link error (non-fatal):', profileError);
    }

    // 4. Sync to Firestore
    await Promise.all([
      syncProfileToFirestore(user.uid, { coupleId: couple.id, dbId: user.dbId }),
      syncCoupleToFirestore(couple.id, { 
        inviteCode: couple.invite_code, 
        partnerAId: user.dbId,
        status: couple.status 
      })
    ]);

    return Response.json({
      couple: {
        id: couple.id,
        inviteCode: couple.invite_code,
        status: couple.status,
        createdAt: couple.created_at,
        partnerAId: user.dbId,
        partnerBId: null,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create couple error:', error);
    return Response.json({ 
      error: 'Failed to create couple', 
      details: error?.message || 'Unknown error' 
    }, { status: 500 });
  }
});

// GET /api/couples — get current user's couple info
export const GET = withAuth(async (_req: NextRequest, user: UserContext) => {
  try {
    const query = supabaseAdmin.from('couples') as any;
    
    // 1. If user has a coupleId in context, use it
    if (user.coupleId) {
      const { data: couple, error } = await query
        .select(`
          id, invite_code, status, created_at,
          partner_a:profiles!couples_partner_a_id_fkey (id, name, avatar_url, onboarding_done),
          partner_b:profiles!couples_partner_b_id_fkey (id, name, avatar_url, onboarding_done)
        `)
        .eq('id', user.coupleId)
        .single();

      if (!error && couple) {
        return Response.json({ couple });
      }
    }

    // 2. Fallback: search for a pending couple where this user is partner_a
    // This handles cases where the profile link is missing or token is stale
    const { data: pending, error: pendingError } = await query
      .select('id, invite_code, status, created_at, partner_a_id, partner_b_id')
      .eq('partner_a_id', user.dbId)
      .eq('status', 'pending')
      .maybeSingle();

    if (pending) {
      return Response.json({ 
        couple: {
          id: pending.id,
          invite_code: pending.invite_code,
          status: pending.status,
          created_at: pending.created_at,
          partner_a: { id: user.dbId }, // minimal profile
          partner_b: null
        }
      });
    }

    return Response.json({ couple: null }, { status: 200 });
  } catch (error) {
    console.error('Get couple error:', error);
    return Response.json({ error: 'Failed to fetch couple' }, { status: 500 });
  }
});
