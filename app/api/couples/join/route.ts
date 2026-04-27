import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, UserContext } from '@/lib/auth/with-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncProfileToFirestore, syncCoupleToFirestore } from '@/lib/auth/firestore-sync';
import { adminDb } from '@/lib/firebase/admin-db';

const JoinSchema = z.object({
  inviteCode: z.string().trim().min(6).max(12).toUpperCase(),
});

// POST /api/couples/join
export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  if (user.coupleId) {
    const { data: couple } = await supabaseAdmin
      .from('couples')
      .select('status')
      .eq('id', user.coupleId)
      .maybeSingle();
      
    if (couple?.status === 'active') {
      return Response.json({ error: 'You are already part of a couple' }, { status: 409 });
    }
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
    if (couple.partner_a_id === user.dbId) {
      return Response.json({ error: 'You cannot join your own couple link' }, { status: 400 });
    }

    // Set partner_b and activate the couple
    const { data: updatedCouple, error: updateCoupleError } = await couplesQuery
      .update({ partner_b_id: user.dbId, status: 'active' })
      .eq('id', couple.id)
      .select('id, invite_code, status, partner_a_id, partner_b_id, created_at')
      .single();

    if (updateCoupleError) throw updateCoupleError;

    // Link both profiles to this couple atomically in a single transaction
    const { error: profilesUpdateError } = await (supabaseAdmin.from('profiles') as any)
      .update({ couple_id: couple.id })
      .in('id', [user.dbId, couple.partner_a_id]);

    if (profilesUpdateError) throw profilesUpdateError;

    // 5. Sync to Firestore
    const syncPromises = [
      syncProfileToFirestore(user.uid, { coupleId: couple.id, dbId: user.dbId }),
      syncCoupleToFirestore(couple.id, { 
        partnerBId: user.dbId, 
        status: 'active' 
      })
    ];

    // Try to find and sync Partner A as well
    try {
      const partnerASnap = await adminDb.collection('profiles')
        .where('dbId', '==', couple.partner_a_id)
        .limit(1)
        .get();

      if (!partnerASnap.empty) {
        const partnerAUid = partnerASnap.docs[0].id;
        syncPromises.push(syncProfileToFirestore(partnerAUid, { coupleId: couple.id }));
      }
    } catch (e) {
      console.error('[JOIN] Failed to find Partner A in Firestore:', e);
    }

    await Promise.all(syncPromises);

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
