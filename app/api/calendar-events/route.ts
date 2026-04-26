import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, UserContext } from "@/lib/auth/with-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CreateCalendarEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(["date", "countdown", "message"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(1000).optional(),
});

const DeleteCalendarEventSchema = z.object({
  eventId: z.string().uuid(),
});

export const GET = withAuth(async (_req: NextRequest, user: UserContext) => {
  try {
    const query = (supabaseAdmin as any).from("calendar_events");
    let dbQuery = query
      .select("id, title, type, date, description, created_at")
      .eq("user_id", user.uid)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });

    if (user.coupleId) {
      dbQuery = dbQuery.eq("couple_id", user.coupleId);
    } else {
      dbQuery = dbQuery.is("couple_id", null);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;

    return Response.json({
      events: (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        date: row.date,
        description: row.description ?? undefined,
      })),
    });
  } catch (error) {
    console.error("Get calendar events error:", error);
    return Response.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateCalendarEventSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { title, type, date, description } = parsed.data;

  try {
    const query = (supabaseAdmin as any).from("calendar_events");
    const { data, error } = await query
      .insert({
        user_id: user.uid,
        couple_id: user.coupleId,
        title,
        type,
        date,
        description: description ?? null,
      })
      .select("id, title, type, date, description")
      .single();

    if (error) throw error;

    return Response.json(
      {
        event: {
          id: data.id,
          title: data.title,
          type: data.type,
          date: data.date,
          description: data.description ?? undefined,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create calendar event error:", error);
    return Response.json({ error: "Failed to create calendar event" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, user: UserContext) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = DeleteCalendarEventSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { eventId } = parsed.data;

  try {
    const query = (supabaseAdmin as any).from("calendar_events");
    let dbQuery = query.delete().eq("id", eventId).eq("user_id", user.uid);

    if (user.coupleId) {
      dbQuery = dbQuery.eq("couple_id", user.coupleId);
    } else {
      dbQuery = dbQuery.is("couple_id", null);
    }

    const { error } = await dbQuery;
    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete calendar event error:", error);
    return Response.json({ error: "Failed to delete calendar event" }, { status: 500 });
  }
});
