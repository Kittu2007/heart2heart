import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/auth/with-auth';

// GET /api/events - List events for the couple
export const GET = withAuth(async (req, user) => {
  if (!user.coupleId) {
    return Response.json({ events: [] });
  }

  const { data: events, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('couple_id', user.coupleId)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('[Events] Fetch error:', error);
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 });
  }

  return Response.json({ events });
});

// POST /api/events - Create a new event
export const POST = withAuth(async (req, user) => {
  if (!user.coupleId) {
    return Response.json({ error: 'No partner linked' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, event_type, event_date } = body;

    if (!title || !event_date || !event_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        couple_id: user.coupleId,
        created_by: user.dbId,
        title,
        description,
        event_type,
        event_date
      })
      .select()
      .single();

    if (error) {
      console.error('[Events] Insert error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ event });
  } catch (err) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
});
