import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-check';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const GET = withAdminAuth(async (req: NextRequest, admin) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, couple_id, onboarding_done, comfort_level, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const headers = ['id', 'name', 'couple_id', 'onboarding_done', 'comfort_level', 'is_admin', 'joined'];
    const rows = ((users as any[]) || []).map((u) =>
      [u.id, `"${u.name.replace(/"/g, '""')}"`, u.couple_id || '', u.onboarding_done, u.comfort_level, u.is_admin, new Date(u.created_at).toISOString()].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bond-users-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return Response.json({ error: 'Failed to export users' }, { status: 500 });
  }
});
