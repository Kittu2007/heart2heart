import { NextRequest } from 'next/server';
import { withAuth, UserContext } from '@/lib/auth/with-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/tasks — fetch today's task for the authenticated user's couple
export const GET = withAuth(async (_req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return Response.json(
      { error: 'No couple linked. Create or join a couple first.' },
      { status: 404 }
    );
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    const query = supabaseAdmin.from('daily_tasks') as any;
    const { data: task, error } = await query
      .select('id, title, description, category, intensity, generated_date, completed, ai_reasoning, created_at')
      .eq('couple_id', user.coupleId)
      .eq('generated_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // returns null instead of 404 if no row

    if (error) throw error;

    return Response.json({ task: task ?? null, date: today });
  } catch (error) {
    console.error('Get task error:', error);
    return Response.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
});

// PATCH /api/tasks — mark today's task as complete
export const PATCH = withAuth(async (req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return Response.json({ error: 'No couple linked' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { taskId } = body as { taskId?: string };
  if (!taskId || typeof taskId !== 'string') {
    return Response.json({ error: 'taskId is required' }, { status: 422 });
  }

  try {
    const query = supabaseAdmin.from('daily_tasks') as any;

    // Verify this task belongs to the user's couple
    const { data: existing, error: fetchError } = await query
      .select('id, couple_id, completed')
      .eq('id', taskId)
      .eq('couple_id', user.coupleId)
      .single();

    if (fetchError || !existing) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }
    if (existing.completed) {
      return Response.json({ error: 'Task already completed' }, { status: 409 });
    }

    const { data: updated, error: updateError } = await query
      .update({ completed: true })
      .eq('id', taskId)
      .select('id, title, completed')
      .single();

    if (updateError) throw updateError;

    return Response.json({ task: updated });
  } catch (error) {
    console.error('Complete task error:', error);
    return Response.json({ error: 'Failed to complete task' }, { status: 500 });
  }
});
