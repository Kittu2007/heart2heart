import { NextRequest, NextResponse } from "next/server";
import { withAuth, UserContext } from "@/lib/auth/with-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/memories — list memories for the couple
export const GET = withAuth(async (req: NextRequest, user: UserContext) => {
  try {
    if (!user.coupleId) {
      return NextResponse.json({ memories: [] });
    }

    const memoriesQuery = supabaseAdmin.from("memories") as any;
    const { data, error } = await memoriesQuery
      .select("*")
      .eq("couple_id", user.coupleId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/memories] Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 });
    }

    return NextResponse.json({ memories: data || [] });
  } catch (err) {
    console.error("[GET /api/memories] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// POST /api/memories — create a memory
export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  if (!user.coupleId) {
    return NextResponse.json({ error: "No partner linked" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, caption, image_url, mood, memory_date } = body;

    if (!image_url) {
      return NextResponse.json({ error: "image_url is required" }, { status: 400 });
    }

    const memoriesQuery = supabaseAdmin.from("memories") as any;
    const { data: memory, error } = await memoriesQuery
      .insert({
        couple_id: user.coupleId,
        uploaded_by: user.dbId,
        title: title?.trim() || null,
        description: description?.trim() || null,
        caption: caption?.trim() || null,
        image_url: image_url.trim(),
        mood: mood || null,
        memory_date: memory_date ? new Date(memory_date).toISOString() : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/memories] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memory });
  } catch (err) {
    console.error("[POST /api/memories] Unexpected error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
});

// DELETE /api/memories?id=xxx
export const DELETE = withAuth(async (req: NextRequest, user: UserContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Memory id is required" }, { status: 400 });
    }

    const memoriesQuery = supabaseAdmin.from("memories") as any;
    
    // Verify ownership
    const { data: existing, error: fetchErr } = await memoriesQuery
      .select("uploaded_by")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }
    if (existing.uploaded_by !== user.dbId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteErr } = await memoriesQuery
      .delete()
      .eq("id", id);

    if (deleteErr) {
      console.error("[DELETE /api/memories] Delete error:", deleteErr);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/memories] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
