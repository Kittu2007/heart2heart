import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, UserContext } from '@/lib/auth/with-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MoodPostSchema = z.object({
  mood: z.string().min(1).max(50).trim(),
  shareWithPartner: z.boolean().default(true),
  note: z.string().max(500).nullable().optional(),
});

// POST /api/mood — log a mood check-in
export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return Response.json({ error: 'No couple linked. Create or join a couple first.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = MoodPostSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { mood, shareWithPartner, note } = parsed.data;

  try {
    const query = supabaseAdmin.from('mood_checkins') as any;
    const { data: checkin, error } = await query
      .insert({
        user_id: user.uid,
        couple_id: user.coupleId,
        mood,
        share_with_partner: shareWithPartner,
        note: note ?? null,
      })
      .select('id, mood, share_with_partner, note, created_at')
      .single();

    if (error) throw error;

    return Response.json({
      checkin: {
        id: checkin.id,
        mood: checkin.mood,
        shareWithPartner: checkin.share_with_partner,
        note: checkin.note,
        createdAt: checkin.created_at,
        userId: user.uid,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Post mood error:', error);
    return Response.json({ error: 'Failed to save mood' }, { status: 500 });
  }
});

// GET /api/mood — get own moods + partner moods (only if shared)
export const GET = withAuth(async (req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return Response.json({ error: 'No couple linked' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0);

  try {
    // Get couple to find partner ID
    const couplesQuery = supabaseAdmin.from('couples') as any;
    const { data: couple, error: coupleError } = await couplesQuery
      .select('partner_a_id, partner_b_id')
      .eq('id', user.coupleId)
      .single();

    if (coupleError || !couple) {
      return Response.json({ error: 'Couple not found' }, { status: 404 });
    }

    const partnerId =
      couple.partner_a_id === user.uid ? couple.partner_b_id : couple.partner_a_id;

    const moodQuery = supabaseAdmin.from('mood_checkins') as any;

    // Own moods — all of them
    const { data: ownMoods, error: ownError } = await moodQuery
      .select('id, mood, share_with_partner, note, created_at')
      .eq('user_id', user.uid)
      .eq('couple_id', user.coupleId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (ownError) throw ownError;

    // Partner moods — only those marked as shared
    let partnerMoods: any[] = [];
    if (partnerId) {
      const { data: pm, error: partnerError } = await moodQuery
        .select('id, mood, note, created_at')
        .eq('user_id', partnerId)
        .eq('couple_id', user.coupleId)
        .eq('share_with_partner', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (partnerError) throw partnerError;
      partnerMoods = pm || [];
    }

    return Response.json({
      own: (ownMoods || []).map((m: any) => ({
        id: m.id,
        mood: m.mood,
        shareWithPartner: m.share_with_partner,
        note: m.note,
        createdAt: m.created_at,
        isOwn: true,
      })),
      partner: partnerMoods.map((m: any) => ({
        id: m.id,
        mood: m.mood,
        note: m.note,
        createdAt: m.created_at,
        isOwn: false,
      })),
      partnerId: partnerId ?? null,
    });
  } catch (error) {
    console.error('Get mood error:', error);
    return Response.json({ error: 'Failed to fetch moods' }, { status: 500 });
  }
});
