import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, UserContext } from '@/lib/auth/with-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MoodPostSchema = z.object({
  mood: z.string().min(1).max(100).trim(),
  emoji: z.string().max(20).nullable().optional(),
  isCustom: z.boolean().default(false),
  shareWithPartner: z.boolean().default(true),
  note: z.string().max(500).nullable().optional(),
});

// POST /api/mood — log a mood check-in
export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return NextResponse.json({ error: 'No couple linked' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = MoodPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { mood, emoji, isCustom, shareWithPartner, note } = parsed.data;

  try {
    const query = supabaseAdmin.from('mood_checkins') as any;
    const { data: checkin, error } = await query
      .insert({
        user_id: user.dbId,
        couple_id: user.coupleId,
        mood,
        emoji: emoji || null,
        is_custom: isCustom,
        share_with_partner: shareWithPartner,
        note: note ?? null,
      })
      .select('id, mood, emoji, is_custom, share_with_partner, note, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      checkin: {
        id: checkin.id,
        mood: checkin.mood,
        emoji: checkin.emoji,
        isCustom: checkin.is_custom,
        shareWithPartner: checkin.share_with_partner,
        note: checkin.note,
        createdAt: checkin.created_at,
        userId: user.dbId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Post mood error:', error);
    return NextResponse.json({ error: 'Failed to save mood' }, { status: 500 });
  }
});

// GET /api/mood — get own moods + partner moods
export const GET = withAuth(async (req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return NextResponse.json({ error: 'No couple linked' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const latestOnly = searchParams.get('latest') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);

  try {
    if (latestOnly) {
      // Return only the single latest mood for the user
      const query = supabaseAdmin.from('mood_checkins') as any;
      const { data: latest, error } = await query
        .select('mood, emoji, note, created_at, share_with_partner')
        .eq('user_id', user.dbId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ latest });
    }

    // Default: Get couple to find partner ID
    const coupleQuery = supabaseAdmin.from('couples') as any;
    const { data: couple, error: coupleError } = await coupleQuery
      .select('partner_a_id, partner_b_id')
      .eq('id', user.coupleId)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 });
    }

    const partnerId = couple.partner_a_id === user.dbId ? couple.partner_b_id : couple.partner_a_id;

    // Fetch own moods
    const ownMoodQuery = supabaseAdmin.from('mood_checkins') as any;
    const { data: ownMoods, error: ownError } = await ownMoodQuery
      .select('id, mood, emoji, is_custom, share_with_partner, note, created_at')
      .eq('user_id', user.dbId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (ownError) throw ownError;

    // Fetch partner moods (if shared)
    let partnerMoods: any[] = [];
    if (partnerId) {
      const partnerMoodQuery = supabaseAdmin.from('mood_checkins') as any;
      const { data: pm, error: partnerError } = await partnerMoodQuery
        .select('id, mood, emoji, note, created_at')
        .eq('user_id', partnerId)
        .eq('share_with_partner', true)
        .order('created_at', { ascending: false })
        .limit(1); // Usually we only care about their current mood on dashboard

      if (partnerError) throw partnerError;
      partnerMoods = pm || [];
    }

    return NextResponse.json({
      own: (ownMoods || []).map((m: any) => ({
        ...m,
        isCustom: m.is_custom,
        shareWithPartner: m.share_with_partner,
        isOwn: true
      })),
      partner: partnerMoods.map((m: any) => ({
        ...m,
        isOwn: false
      })),
    });
  } catch (error) {
    console.error('Get mood error:', error);
    return NextResponse.json({ error: 'Failed to fetch moods' }, { status: 500 });
  }
});
