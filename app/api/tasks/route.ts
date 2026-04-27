import { NextRequest } from 'next/server';
import { withAuth, UserContext } from '@/lib/auth/with-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { adminDb } from '@/lib/firebase/admin-db';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/tasks — fetch today's task for the authenticated user's couple
export const GET = withAuth(async (req: NextRequest, user: UserContext) => {
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

    let currentTask = task;

    if (!currentTask) {
      // Seed a daily task on first activation/new day
      let newTaskData = {
        title: "Appreciation Moment",
        description: "Share three things you genuinely appreciate about your partner today.",
        category: "connection",
        intensity: 1,
      };

      try {
        const aiRes = await fetch(new URL('/api/generate-task', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mood: 'Neutral', loveLanguage: 'Quality Time', comfortLevel: 3 }),
        });
        
        if (aiRes.ok) {
          const generated = await aiRes.json();
          if (generated.title && generated.description) {
            newTaskData = {
              title: generated.title,
              description: generated.description,
              category: generated.category || 'general',
              intensity: generated.intensity || 2,
            };
          }
        }
      } catch (err) {
        console.error('Failed to generate AI task during seeding, using fallback:', err);
      }

      // Insert the seeded task (fallback or AI)
      const { data: insertedTask, error: insertError } = await query
        .insert({
          couple_id: user.coupleId,
          generated_date: today,
          title: newTaskData.title,
          description: newTaskData.description,
          category: newTaskData.category,
          intensity: newTaskData.intensity,
        })
        .select('id, title, description, category, intensity, generated_date, completed, ai_reasoning, created_at')
        .single();

      if (!insertError && insertedTask) {
        currentTask = insertedTask;
      }
    }

    return Response.json({ task: currentTask ?? null, date: today });
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

    // ── SYNC TO FIRESTORE ───────────────────────────────────────────
    // Update the couple's document in Firestore to trigger real-time onSnapshot for the partner
    try {
      await adminDb.doc(`couples/${user.coupleId}`).set({
        taskCompleted: true,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (fsError) {
      console.error('[PATCH /api/tasks] Firestore sync failed:', fsError);
      // Non-fatal, we still return the updated task from Supabase
    }
    // ────────────────────────────────────────────────────────────────

    return Response.json({ task: updated });
  } catch (error) {
    console.error('Complete task error:', error);
    return Response.json({ error: 'Failed to complete task' }, { status: 500 });
  }
});

