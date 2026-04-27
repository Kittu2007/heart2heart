import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/auth/with-auth';

// GET /api/memories - List memories for the couple
export const GET = withAuth(async (req, user) => {
  if (!user.coupleId) {
    return Response.json({ memories: [] });
  }

  const { data: memories, error } = await supabaseAdmin
    .from('memories')
    .select('*')
    .eq('couple_id', user.coupleId)
    .order('memory_date', { ascending: false });

  if (error) {
    console.error('[Memories] Fetch error:', error);
    return Response.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }

  return Response.json({ memories });
});

// POST /api/memories - Create a new memory
export const POST = withAuth(async (req, user) => {
  if (!user.coupleId) {
    return Response.json({ error: 'No partner linked' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, memory_date, image_url, mood } = body;

    if (!title || !memory_date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: memory, error } = await supabaseAdmin
      .from('memories')
      .insert({
        couple_id: user.coupleId,
        created_by: user.dbId,
        title,
        description,
        memory_date,
        image_url,
        mood
      })
      .select()
      .single();

    if (error) {
      console.error('[Memories] Insert error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ memory });
  } catch (err) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
});
