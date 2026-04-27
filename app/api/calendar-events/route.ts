import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withAuth, UserContext } from "@/lib/auth/with-auth";

// ─── GET /api/calendar-events ─────────────────────────────────────────────────

export const GET = withAuth(async (request: NextRequest, user: UserContext) => {
  try {
    if (!user.coupleId) {
      return NextResponse.json([], { status: 200 });
    }

    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .select("*")
      .eq("couple_id", user.coupleId)
      .order("date", { ascending: true }); // Using 'date' as per schema.sql

    if (error) {
      console.error("[GET /api/calendar-events] Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    // Map DB fields to UI expectation if needed
    const mappedData = (data || []).map((event: any) => ({
      ...event,
      start_time: event.date, // Shim for UI
    }));

    return NextResponse.json(mappedData, { status: 200 });
  } catch (err) {
    console.error("[GET /api/calendar-events] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ─── POST /api/calendar-events ────────────────────────────────────────────────

export const POST = withAuth(async (request: NextRequest, user: UserContext) => {
  try {
    if (!user.coupleId) {
      return NextResponse.json({ error: "No partner linked" }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, start_time, event_type } = body;

    if (!title || !start_time) {
      return NextResponse.json(
        { error: "title and start_time are required" },
        { status: 400 }
      );
    }

    const { data, error } = await (supabaseAdmin.from("calendar_events") as any)
      .insert({
        title,
        description: description ?? null,
        date: start_time.split('T')[0], // Extract YYYY-MM-DD for DATE column
        type: event_type === 'activity' ? 'date' : (event_type || 'date'), // Map to schema allowed values
        couple_id: user.coupleId,
        user_id: user.dbId,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/calendar-events] Supabase error:", error);
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/calendar-events] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ─── DELETE /api/calendar-events?id={id} ─────────────────────────────────────

export const DELETE = withAuth(async (request: NextRequest, user: UserContext) => {
  try {
    const eventId = request.nextUrl.searchParams.get("id");
    if (!eventId) {
      return NextResponse.json({ error: "Event id is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("calendar_events")
      .delete()
      .eq("id", eventId)
      .eq("user_id", user.dbId);

    if (error) {
      console.error("[DELETE /api/calendar-events] Supabase error:", error);
      return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/calendar-events] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
