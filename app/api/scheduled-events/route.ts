import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withAuth, UserContext } from "@/lib/auth/with-auth";
import { z } from "zod";

const ScheduledEventSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  message: z.string().max(2000).optional(),
  scheduled_for: z.string().datetime(), // ISO string with time
});

export const GET = withAuth(async (req: NextRequest, user: UserContext) => {
  try {
    if (!user.coupleId) {
      return NextResponse.json({ events: [] });
    }

    const query = supabaseAdmin.from("scheduled_events") as any;
    const { data, error } = await query
      .select("*")
      .eq("couple_id", user.coupleId)
      .order("scheduled_for", { ascending: true });

    if (error) {
      console.error("[GET /api/scheduled-events] Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch scheduled events" }, { status: 500 });
    }

    return NextResponse.json({ events: data });
  } catch (err) {
    console.error("[GET /api/scheduled-events] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  try {
    if (!user.coupleId) {
      return NextResponse.json({ error: "Not in a couple" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ScheduledEventSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { title, message, scheduled_for } = parsed.data;

    const query = supabaseAdmin.from("scheduled_events") as any;
    const { data, error } = await query
      .insert({
        couple_id: user.coupleId,
        created_by: user.dbId,
        title,
        message: message || null,
        scheduled_for,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/scheduled-events] Supabase error:", error);
      return NextResponse.json({ error: "Failed to create scheduled event" }, { status: 500 });
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/scheduled-events] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, user: UserContext) => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const query = supabaseAdmin.from("scheduled_events") as any;
    const { error } = await query
      .delete()
      .eq("id", id)
      .eq("couple_id", user.coupleId);

    if (error) {
      console.error("[DELETE /api/scheduled-events] Supabase error:", error);
      return NextResponse.json({ error: "Failed to delete scheduled event" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/scheduled-events] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
