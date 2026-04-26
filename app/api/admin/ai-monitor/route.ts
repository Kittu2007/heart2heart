import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-check';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const AiMonitorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  status: z.enum(['success', 'error', 'fallback', 'all']).default('all'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const DAILY_QUOTA_ESTIMATE = 1500;

export const GET = withAdminAuth(async (req: NextRequest, admin) => {
  const { searchParams } = new URL(req.url);
  const parsed = AiMonitorQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { page, limit, status, date } = parsed.data;
  const offset = (page - 1) * limit;
  const today = new Date().toISOString().split('T')[0];
  const targetDate = date || today;

  try {
    const [totalCallsResult, successResult, errorResult, fallbackResult, avgLatencyResult, avgTokensResult] = await Promise.all([
      supabaseAdmin.from('ai_logs').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('ai_logs').select('id', { count: 'exact', head: true }).eq('status', 'success'),
      supabaseAdmin.from('ai_logs').select('id', { count: 'exact', head: true }).eq('status', 'error'),
      supabaseAdmin.from('ai_logs').select('id', { count: 'exact', head: true }).eq('status', 'fallback'),
      supabaseAdmin.from('ai_logs').select('latency_ms').eq('status', 'success').not('latency_ms', 'is', null),
      supabaseAdmin.from('ai_logs').select('token_count').not('token_count', 'is', null),
    ]);

    const totalCalls = totalCallsResult.count || 0;
    const errorCount = errorResult.count || 0;
    const latencyRows = (avgLatencyResult.data as any[]) || [];
    const avgLatency = latencyRows.length > 0 ? Math.round(latencyRows.reduce((s, r) => s + (r.latency_ms || 0), 0) / latencyRows.length) : null;
    const tokenRows = (avgTokensResult.data as any[]) || [];
    const avgTokens = tokenRows.length > 0 ? Math.round(tokenRows.reduce((s, r) => s + (r.token_count || 0), 0) / tokenRows.length) : null;
    const errorRate = totalCalls > 0 ? +((errorCount / totalCalls) * 100).toFixed(2) : 0;

    const { count: todayCount } = await supabaseAdmin.from('ai_logs').select('id', { count: 'exact', head: true }).gte('timestamp', `${targetDate}T00:00:00Z`).lt('timestamp', `${targetDate}T23:59:59Z`);
    const todayCalls = todayCount || 0;
    const quotaUsedPct = DAILY_QUOTA_ESTIMATE > 0 ? Math.round((todayCalls / DAILY_QUOTA_ESTIMATE) * 100) : null;

    let logsQuery = supabaseAdmin
      .from('ai_logs')
      .select('id, timestamp, couple_id, operation_type, model_used, latency_ms, status, error_message, prompt_hash, token_count', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') logsQuery = logsQuery.eq('status', status);
    if (date) logsQuery = logsQuery.gte('timestamp', `${date}T00:00:00Z`).lt('timestamp', `${date}T23:59:59Z`);

    const { data: logs, error: logsError, count: logsCount } = await logsQuery;
    if (logsError) throw logsError;

    const { data: recentErrors } = await supabaseAdmin.from('ai_logs').select('id, timestamp, couple_id, error_message, prompt_hash, latency_ms').eq('status', 'error').order('timestamp', { ascending: false }).limit(10);
    const { data: opBreakdown } = await supabaseAdmin.from('ai_logs').select('operation_type');
    const opBreakdownRows = (opBreakdown as any[]) || [];
    const opCounts = opBreakdownRows.reduce<Record<string, number>>((acc, r) => { acc[r.operation_type] = (acc[r.operation_type] || 0) + 1; return acc; }, {});

    const totalPages = Math.ceil((logsCount || 0) / limit);
    return Response.json({
      summary: { totalCalls, successCount: successResult.count || 0, errorCount, fallbackCount: fallbackResult.count || 0, errorRate, avgLatencyMs: avgLatency, avgTokensPerCall: avgTokens, operationBreakdown: opCounts },
      today: { date: targetDate, calls: todayCalls, quotaEstimate: DAILY_QUOTA_ESTIMATE, quotaUsedPercent: quotaUsedPct },
      recentErrors: recentErrors || [],
      logs: logs || [],
      pagination: { page, limit, total: logsCount || 0, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      requestedBy: admin.name,
    });
  } catch (error) {
    console.error('Admin AI monitor error:', error);
    return Response.json({ error: 'Failed to fetch AI monitor data' }, { status: 500 });
  }
});
