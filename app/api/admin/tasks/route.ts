import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-check';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const ListTasksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  couple_id: z.string().uuid().optional(),
  category: z.string().trim().optional(),
  completed: z.enum(['true', 'false', 'all']).default('all'),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});

const TaskOverrideSchema = z.object({
  task_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.string().max(50).optional(),
  intensity: z.number().int().min(1).max(5).optional(),
  ai_reasoning: z.string().max(1000).optional(),
});

export const GET = withAdminAuth(async (req: NextRequest, admin) => {
  const { searchParams } = new URL(req.url);
  const parsed = ListTasksSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { page, limit, couple_id, category, completed, date_from, date_to, sort_dir } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from('daily_tasks')
      .select(
        `id, title, description, category, intensity, generated_date, completed, ai_reasoning, gemini_prompt_hash, created_at,
        couples!daily_tasks_couple_id_fkey (
          id,
          partner_a:profiles!couples_partner_a_id_fkey (id, name),
          partner_b:profiles!couples_partner_b_id_fkey (id, name)
        )`,
        { count: 'exact' }
      )
      .order('generated_date', { ascending: sort_dir === 'asc' })
      .range(offset, offset + limit - 1);

    if (couple_id) query = query.eq('couple_id', couple_id);
    if (category) query = query.ilike('category', `%${category}%`);
    if (completed !== 'all') query = query.eq('completed', completed === 'true');
    if (date_from) query = query.gte('generated_date', date_from);
    if (date_to) query = query.lte('generated_date', date_to);

    const { data: tasks, error, count } = await query;
    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);
    return Response.json({
      tasks: tasks || [],
      pagination: { page, limit, total: count || 0, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      requestedBy: admin.name,
    });
  } catch (error) {
    console.error('Admin tasks list error:', error);
    return Response.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
});

export const PATCH = withAdminAuth(async (req: NextRequest, admin) => {
  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = TaskOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
  }

  const { task_id, ...updates } = parsed.data;

  try {
    const { data: existing, error: fetchError } = await supabaseAdmin.from('daily_tasks').select('id, title, couple_id').eq('id', task_id).single();
    if (fetchError || !existing) return Response.json({ error: 'Task not found' }, { status: 404 });

    const query = supabaseAdmin.from('daily_tasks') as any;
    const { data: updated, error: updateError } = await query
      .update({ ...updates, gemini_prompt_hash: null })
      .eq('id', task_id)
      .select()
      .single();

    if (updateError) throw updateError;
    return Response.json({ success: true, task: updated, overriddenBy: admin.name, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Admin task override error:', error);
    return Response.json({ error: 'Failed to override task' }, { status: 500 });
  }
});
