import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-check';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const ListUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  onboarding_status: z.enum(['done', 'pending', 'all']).default('all'),
  couple_status: z.enum(['connected', 'solo', 'all']).default('all'),
  sort_by: z.enum(['created_at', 'name']).default('created_at'),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});

const UserActionSchema = z.object({
  user_id: z.string().uuid(),
  action: z.enum(['deactivate', 'reactivate', 'promote_admin', 'reset_onboarding']),
});

export const GET = withAdminAuth(async (req: NextRequest, admin) => {
  const { searchParams } = new URL(req.url);
  const parsed = ListUsersSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { page, limit, search, onboarding_status, couple_status, sort_by, sort_dir } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from('profiles')
      .select(
        `id, name, avatar_url, couple_id, onboarding_done, comfort_level, is_admin, created_at,
        couples!profiles_couple_id_fkey (id, status, invite_code, partner_a_id, partner_b_id)`,
        { count: 'exact' }
      );

    if (search) query = query.ilike('name', `%${search}%`);
    if (onboarding_status !== 'all') query = query.eq('onboarding_done', onboarding_status === 'done');
    if (couple_status === 'connected') query = query.not('couple_id', 'is', null);
    else if (couple_status === 'solo') query = query.is('couple_id', null);

    query = query.order(sort_by, { ascending: sort_dir === 'asc' }).range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;
    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);
    return Response.json({
      users: users || [],
      pagination: { page, limit, total: count || 0, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      requestedBy: admin.name,
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
});

export const POST = withAdminAuth(async (req: NextRequest, admin) => {
  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = UserActionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
  }

  const { user_id, action } = parsed.data;
  if (user_id === admin.uid && action === 'deactivate') {
    return Response.json({ error: 'Cannot deactivate your own admin account' }, { status: 400 });
  }

  try {
    const { data: targetUserData, error: fetchError } = await supabaseAdmin
      .from('profiles').select('id, name, is_admin').eq('id', user_id).single();
    const targetUser = targetUserData as any;
    if (fetchError || !targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

    let updatePayload: Partial<{ is_admin: boolean; onboarding_done: boolean }> = {};
    let message = '';

    switch (action) {
      case 'deactivate': updatePayload = { is_admin: false }; message = `User ${targetUser.name} deactivated`; break;
      case 'reactivate': message = `User ${targetUser.name} reactivated`; break;
      case 'promote_admin': updatePayload = { is_admin: true }; message = `User ${targetUser.name} promoted to admin`; break;
      case 'reset_onboarding': updatePayload = { onboarding_done: false }; message = `Onboarding reset for ${targetUser.name}`; break;
    }

    if (Object.keys(updatePayload).length > 0) {
      const query = supabaseAdmin.from('profiles') as any;
      const { error: updateError } = await query.update(updatePayload).eq('id', user_id);
      if (updateError) throw updateError;
    }

    return Response.json({ success: true, message, userId: user_id, action, performedBy: admin.name, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Admin user action error:', error);
    return Response.json({ error: 'Failed to perform user action' }, { status: 500 });
  }
});
