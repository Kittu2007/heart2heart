import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, UserContext } from '@/lib/auth/with-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncProfileToFirestore, syncCoupleToFirestore } from '@/lib/auth/firestore-sync';

const JoinSchema = z.object({
  inviteCode: z.string().trim().min(6).max(12).toUpperCase(),
});

// POST /api/couples/join
export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  if (user.coupleId) {
    return Response.json({ error: 'You are already part of a couple' }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = JoinSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { inviteCode } = parsed.data;

  try {
    const couplesQuery = supabaseAdmin.from('couples') as any;
    const { data: couple, error: findError } = await couplesQuery
      .select('id, invite_code, status, partner_a_id, partner_b_id')
      .eq('invite_code', inviteCode)
      .single();

    if (findError || !couple) {
      return Response.json({ error: 'Invalid invite code' }, { status: 404 });
    }
    if (couple.status === 'active') {
      return Response.json({ error: 'This couple is already full' }, { status: 409 });
    }
    if (couple.partner_a_id === user.uid) {
      return Response.json({ error: 'You cannot join your own couple link' }, { status: 400 });
    }

    // Set partner_b and activate the couple
    const { data: updatedCouple, error: updateCoupleError } = await couplesQuery
      .update({ partner_b_id: user.uid, status: 'active' })
      .eq('id', couple.id)
      .select('id, invite_code, status, partner_a_id, partner_b_id, created_at')
      .single();

    if (updateCoupleError) throw updateCoupleError;

    // Link both profiles to this couple
    const profilesQuery = supabaseAdmin.from('profiles') as any;
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      profilesQuery.update({ couple_id: couple.id }).eq('id', user.uid),
      profilesQuery.update({ couple_id: couple.id }).eq('id', couple.partner_a_id),
    ]);

    if (e1) throw e1;
    if (e2) throw e2;

    // 5. Sync to Firestore
    await Promise.all([
      syncProfileToFirestore(user.uid, { coupleId: couple.id }),
      syncProfileToFirestore(couple.partner_a_id, { coupleId: couple.id }),
      syncCoupleToFirestore(couple.id, { 
        partnerBId: user.uid, 
        status: 'active' 
      })
    ]);

    return Response.json({
      couple: {
        id: updatedCouple.id,
        inviteCode: updatedCouple.invite_code,
        status: updatedCouple.status,
        partnerAId: updatedCouple.partner_a_id,
        partnerBId: updatedCouple.partner_b_id,
        createdAt: updatedCouple.created_at,
      },
    });
  } catch (error) {
    console.error('Join couple error:', error);
    return Response.json({ error: 'Failed to join couple' }, { status: 500 });
  }
});
