import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/auth/with-auth';

// GET /api/locked-messages
// Returns ALL messages for the couple.
// Locked ones have content = null and is_unlocked = false.
// Server enforces hiding — not the client.
export const GET = withAuth(async (req, user) => {
  if (!user.coupleId) {
    return Response.json({ messages: [] });
  }

  const { data: rows, error } = await (supabaseAdmin as any)
    .from('locked_messages')
    .select(`
      id,
      unlock_at,
      sender_id,
      created_at,
      content
    `)
    .eq('couple_id', user.coupleId)
    .order('unlock_at', { ascending: true });

  if (error) {
    console.error('[LockedMessages] Fetch error:', error);
    return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }

  const now = new Date();

  const messages = (rows ?? []).map((row: any) => {
    const isUnlocked = new Date(row.unlock_at) <= now;
    return {
      id: row.id,
      unlock_at: row.unlock_at,
      sender_id: row.sender_id,
      created_at: row.created_at,
      is_unlocked: isUnlocked,
      // Hide content server-side if not yet unlocked
      content: isUnlocked ? row.content : null,
    };
  });

  return Response.json({ messages });
});

// POST /api/locked-messages
// Create a locked message for the couple.
export const POST = withAuth(async (req, user) => {
  if (!user.coupleId) {
    return Response.json({ error: 'No partner linked' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { content, unlock_at } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return Response.json({ error: 'Message content is required' }, { status: 400 });
    }
    if (!unlock_at) {
      return Response.json({ error: 'unlock_at date is required' }, { status: 400 });
    }

    const unlockDate = new Date(unlock_at);
    if (isNaN(unlockDate.getTime()) || unlockDate <= new Date()) {
      return Response.json({ error: 'unlock_at must be a valid future date' }, { status: 400 });
    }

    const { data: message, error } = await (supabaseAdmin as any)
      .from('locked_messages')
      .insert({
        couple_id: user.coupleId,
        sender_id: user.dbId,
        content: content.trim(),
        unlock_at: unlockDate.toISOString(),
      })
      .select('id, unlock_at, sender_id, created_at')
      .single();

    if (error) {
      console.error('[LockedMessages] Insert error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      message: {
        ...message,
        is_unlocked: false,
        content: null, // never return content on creation
      },
    });
  } catch (err) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
});

// DELETE /api/locked-messages?id=xxx
// Only the sender can delete their own message.
export const DELETE = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return Response.json({ error: 'Message id is required' }, { status: 400 });
  }

  // Verify ownership
  const { data: existing, error: fetchErr } = await (supabaseAdmin as any)
    .from('locked_messages')
    .select('sender_id')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return Response.json({ error: 'Message not found' }, { status: 404 });
  }
  if (existing.sender_id !== user.dbId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteErr } = await (supabaseAdmin as any)
    .from('locked_messages')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return Response.json({ error: deleteErr.message }, { status: 500 });
  }

  return Response.json({ success: true });
});
