import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-check';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const ListCouplesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'pending', 'all']).default('all'),
  engagement: z.enum(['high', 'low', 'all']).default('all'),
  sort_by: z.enum(['created_at', 'avg_rating', 'tasks_done']).default('created_at'),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});

export const GET = withAdminAuth(async (req: NextRequest, admin) => {
  const { searchParams } = new URL(req.url);
  const parsed = ListCouplesSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { page, limit, status, sort_by, sort_dir } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    let couplesQuery = supabaseAdmin
      .from('couples')
      .select(
        `id, invite_code, status, created_at,
        partner_a:profiles!couples_partner_a_id_fkey (id, name, avatar_url, onboarding_done),
        partner_b:profiles!couples_partner_b_id_fkey (id, name, avatar_url, onboarding_done)`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: sort_dir === 'asc' })
      .range(offset, offset + limit - 1);

    if (status !== 'all') couplesQuery = couplesQuery.eq('status', status);

    const { data: couples, error: couplesError, count } = await couplesQuery;
    if (couplesError) throw couplesError;

    const enriched = await Promise.all(
      ((couples as any[]) || []).map(async (couple) => {
        const [tasksResult, feedbackResult] = await Promise.all([
          supabaseAdmin.from('daily_tasks').select('id, completed', { count: 'exact' }).eq('couple_id', couple.id),
          supabaseAdmin.from('feedback').select('rating, sentiment_score').eq('couple_id', couple.id),
        ]);

        const tasks = (tasksResult.data as any[]) || [];
        const feedbackRows = (feedbackResult.data as any[]) || [];
        const totalTasks = tasksResult.count || 0;
        const completedTasks = tasks.filter((t) => t.completed).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const avgRating = feedbackRows.length > 0 ? +(feedbackRows.reduce((s, f) => s + (f.rating || 0), 0) / feedbackRows.length).toFixed(2) : null;
        const avgSentiment = feedbackRows.filter((f) => f.sentiment_score !== null).length > 0 ? +(feedbackRows.reduce((s, f) => s + (f.sentiment_score || 0), 0) / feedbackRows.length).toFixed(3) : null;
        const engagementScore = avgRating !== null ? Math.round((avgRating / 5) * 60 + completionRate * 0.4) : null;

        return { ...couple, metrics: { totalTasks, completedTasks, completionRate, avgRating, avgSentiment, engagementScore, feedbackCount: feedbackRows.length } };
      })
    );

    let filtered = enriched;
    if (parsed.data.engagement === 'high') filtered = enriched.filter((c) => c.metrics.engagementScore !== null && c.metrics.engagementScore >= 70);
    else if (parsed.data.engagement === 'low') filtered = enriched.filter((c) => c.metrics.engagementScore === null || c.metrics.engagementScore < 70);

    if (sort_by === 'avg_rating') filtered.sort((a, b) => sort_dir === 'desc' ? (b.metrics.avgRating ?? -1) - (a.metrics.avgRating ?? -1) : (a.metrics.avgRating ?? -1) - (b.metrics.avgRating ?? -1));
    else if (sort_by === 'tasks_done') filtered.sort((a, b) => sort_dir === 'desc' ? b.metrics.completedTasks - a.metrics.completedTasks : a.metrics.completedTasks - b.metrics.completedTasks);

    const totalPages = Math.ceil((count || 0) / limit);
    return Response.json({
      couples: filtered,
      pagination: { page, limit, total: count || 0, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      requestedBy: admin.name,
    });
  } catch (error) {
    console.error('Admin couples error:', error);
    return Response.json({ error: 'Failed to fetch couples' }, { status: 500 });
  }
});
