import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/auth/with-auth';

// GET /api/memories — list memories for the couple
export const GET = withAuth(async (req, user) => {
  if (!user.coupleId) {
    return Response.json({ memories: [] });
  }

  const { data: memories, error } = await (supabaseAdmin as any)
    .from('memories')
    .select('*')
    .eq('couple_id', user.coupleId)
    .order('memory_date', { ascending: false });

  if (error) {
    console.error('[Memories] Fetch error:', error);
    return Response.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }

  return Response.json({ memories: memories ?? [] });
});

// POST /api/memories — create a memory
export const POST = withAuth(async (req, user) => {
  if (!user.coupleId) {
    return Response.json({ error: 'No partner linked' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, memory_date, image_url, mood } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!memory_date) {
      return Response.json({ error: 'memory_date is required' }, { status: 400 });
    }

    const { data: memory, error } = await (supabaseAdmin as any)
      .from('memories')
      .insert({
        couple_id: user.coupleId,
        uploaded_by: user.dbId,
        title: title.trim(),
        description: description?.trim() ?? null,
        memory_date: new Date(memory_date).toISOString(),
        image_url: image_url?.trim() ?? null,
        mood: mood ?? null,
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

// DELETE /api/memories?id=xxx — uploader only
export const DELETE = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return Response.json({ error: 'Memory id is required' }, { status: 400 });
  }

  // Verify ownership
  const { data: existing, error: fetchErr } = await (supabaseAdmin as any)
    .from('memories')
    .select('uploaded_by, image_url')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return Response.json({ error: 'Memory not found' }, { status: 404 });
  }
  if (existing.uploaded_by !== user.dbId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteErr } = await (supabaseAdmin as any)
    .from('memories')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return Response.json({ error: deleteErr.message }, { status: 500 });
  }

  return Response.json({ success: true });
});
