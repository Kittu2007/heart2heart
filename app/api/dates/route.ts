import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, UserContext } from '@/lib/auth/with-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DateSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  type: z.enum(['date', 'countdown', 'message']),
  date: z.string(), // ISO format YYYY-MM-DD expected
  description: z.string().optional(),
});

export const GET = withAuth(async (req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return Response.json({ error: 'Not in a couple' }, { status: 403 });
  }

  try {
    const { data: dates, error } = await (supabaseAdmin as any)
      .from('couple_dates')
      .select('*')
      .eq('couple_id', user.coupleId)
      .order('date', { ascending: true });

    if (error) throw error;

    const formattedDates = dates.map((d: any) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      date: d.date,
      description: d.note,
    }));

    return Response.json({ events: formattedDates });
  } catch (error) {
    console.error('Error fetching dates:', error);
    return Response.json({ error: 'Failed to fetch dates' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return Response.json({ error: 'Not in a couple' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = DateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { title, type, date, description } = parsed.data;

  try {
    const { data: inserted, error } = await (supabaseAdmin as any)
      .from('couple_dates')
      .insert({
        couple_id: user.coupleId,
        created_by: user.dbId,
        title,
        type,
        date,
        note: description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      event: {
        id: inserted.id,
        title: inserted.title,
        type: inserted.type,
        date: inserted.date,
        description: inserted.note,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding date:', error);
    return Response.json({ error: 'Failed to add date' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return Response.json({ error: 'Not in a couple' }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return Response.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const { error } = await (supabaseAdmin as any)
      .from('couple_dates')
      .delete()
      .eq('id', id)
      .eq('couple_id', user.coupleId);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting date:', error);
    return Response.json({ error: 'Failed to delete date' }, { status: 500 });
  }
});
