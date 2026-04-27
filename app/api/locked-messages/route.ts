import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/auth/with-auth';

// GET /api/locked-messages - List messages for the couple
export const GET = withAuth(async (req, user) => {
  if (!user.coupleId) {
    return Response.json({ messages: [] });
  }

  const { data: messages, error } = await supabaseAdmin
    .from('locked_messages')
    .select('*')
    .eq('couple_id', user.coupleId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[LockedMessages] Fetch error:', error);
    return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }

  return Response.json({ messages });
});

// POST /api/locked-messages - Create a new locked message
export const POST = withAuth(async (req, user) => {
  if (!user.coupleId) {
    return Response.json({ error: 'No partner linked' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { content, unlock_at } = body;

    if (!content || !unlock_at) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: message, error } = await supabaseAdmin
      .from('locked_messages')
      .insert({
        couple_id: user.coupleId,
        sender_id: user.dbId,
        content,
        unlock_at,
        is_unlocked: false
      })
      .select()
      .single();

    if (error) {
      console.error('[LockedMessages] Insert error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message });
  } catch (err) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
});
