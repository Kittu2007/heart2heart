import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-check';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = withAdminAuth(async (req: NextRequest, admin, ctx?: RouteContext) => {
  const { id: coupleId } = await (ctx as RouteContext).params;
  if (!coupleId) return Response.json({ error: 'Missing couple ID' }, { status: 400 });

  try {
    const { data: couple, error: coupleError } = await supabaseAdmin
      .from('couples')
      .select(
        `id, invite_code, status, created_at,
        partner_a:profiles!couples_partner_a_id_fkey (id, name, avatar_url, onboarding_done, comfort_level, created_at),
        partner_b:profiles!couples_partner_b_id_fkey (id, name, avatar_url, onboarding_done, comfort_level, created_at)`
      )
      .eq('id', coupleId)
      .single();

    if (coupleError || !couple) return Response.json({ error: 'Couple not found' }, { status: 404 });

    const { data: tasks } = await supabaseAdmin
      .from('daily_tasks')
      .select('id, title, category, intensity, generated_date, completed, ai_reasoning')
      .eq('couple_id', coupleId)
      .order('generated_date', { ascending: false })
      .limit(30);

    const { data: feedback } = await supabaseAdmin
      .from('feedback')
      .select('rating, sentiment_score, feeling_tag, created_at, user_id')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: true });

    const sentimentByDay: Record<string, { positive: number; negative: number; count: number }> = {};
    const feedbackRows = (feedback as any[]) || [];
    feedbackRows.forEach((f) => {
      const day = new Date(f.created_at).toISOString().split('T')[0];
      if (!sentimentByDay[day]) sentimentByDay[day] = { positive: 0, negative: 0, count: 0 };
      sentimentByDay[day].count++;
      if ((f.sentiment_score ?? 0) >= 0) sentimentByDay[day].positive++;
      else sentimentByDay[day].negative++;
    });

    const sentimentChart = Object.entries(sentimentByDay).sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([date, vals]) => ({ date, ...vals }));
    const allFeedback = feedbackRows;
    const avgRating = allFeedback.length > 0 ? +(allFeedback.reduce((s, f) => s + f.rating, 0) / allFeedback.length).toFixed(2) : null;
    const feelingTagCounts = allFeedback.reduce<Record<string, number>>((acc, f) => { if (f.feeling_tag) acc[f.feeling_tag] = (acc[f.feeling_tag] || 0) + 1; return acc; }, {});

    return Response.json({
      couple,
      taskHistory: tasks || [],
      feedbackSummary: { totalFeedback: allFeedback.length, avgRating, feelingTagCounts, sentimentChart },
      requestedBy: admin.name,
    });
  } catch (error) {
    console.error('Admin couple detail error:', error);
    return Response.json({ error: 'Failed to fetch couple detail' }, { status: 500 });
  }
});
