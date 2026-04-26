import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-check';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const GET = withAdminAuth(async (req: NextRequest, admin) => {
  try {
    const [
      usersResult,
      activeCouplesResult,
      tasksGeneratedTodayResult,
      recentUsersResult,
      completedTasksResult,
      totalTasksResult,
      feedbackStatsResult,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('couples').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('daily_tasks').select('id', { count: 'exact', head: true }).eq('generated_date', new Date().toISOString().split('T')[0]),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabaseAdmin.from('daily_tasks').select('id', { count: 'exact', head: true }).eq('completed', true),
      supabaseAdmin.from('daily_tasks').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('feedback').select('rating, sentiment_score'),
    ]);

    let engagementScore = 0;
    const feedbackRows = (feedbackStatsResult.data as any[]) || [];
    if (feedbackRows.length > 0) {
      const avgRating = feedbackRows.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackRows.length;
      const avgSentiment = feedbackRows.reduce((sum, f) => sum + (f.sentiment_score || 0), 0) / feedbackRows.length;
      engagementScore = Math.round((avgRating / 5) * 0.6 * 100 + ((avgSentiment + 1) / 2) * 0.4 * 100);
    }

    const totalTasks = totalTasksResult.count || 0;
    const completedTasks = completedTasksResult.count || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return Response.json({
      stats: {
        totalUsers: usersResult.count || 0,
        activeCouples: activeCouplesResult.count || 0,
        tasksGeneratedToday: tasksGeneratedTodayResult.count || 0,
        engagementScore,
        recentRegistrations24h: recentUsersResult.count || 0,
        taskCompletionRate: completionRate,
        completedTasks,
        totalTasks,
      },
      timestamp: new Date().toISOString(),
      requestedBy: admin.name,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return Response.json({ error: 'Failed to fetch admin statistics' }, { status: 500 });
  }
});
