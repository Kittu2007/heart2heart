import { NextRequest, NextResponse } from "next/server";
import { withAuth, UserContext } from "@/lib/auth/with-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  try {
    if (!user.coupleId) {
      return NextResponse.json({ error: "No couple linked" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Upload to Supabase Storage using Service Role (bypassing RLS)
    // Path: memories/{coupleId}/{timestamp}_{filename}
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "-")}`;
    const filePath = `${user.coupleId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("memories")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Memories Upload API] Storage error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("memories")
      .getPublicUrl(filePath);

    // 3. Save Memory Record to Database
    const memoriesQuery = supabaseAdmin.from("memories") as any;
    const { data: memoryRecord, error: dbError } = await memoriesQuery
      .insert({
        couple_id: user.coupleId,
        uploaded_by: user.dbId,
        image_url: publicUrl,
        caption: caption || null,
      })
      .select("*")
      .single();

    if (dbError) {
      console.error("[Memories Upload API] Database error:", dbError);
      return NextResponse.json({ error: "Failed to save memory record" }, { status: 500 });
    }

    return NextResponse.json(memoryRecord);
  } catch (err) {
    console.error("[Memories Upload API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
