import { NextRequest, NextResponse } from "next/server";
import { withAuth, UserContext } from "@/lib/auth/with-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const POST = withAuth(async (req: NextRequest, user: UserContext) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Upload to Supabase Storage using Service Role (bypassing RLS)
    // Path: {firebaseUid}/{filename}
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const filePath = `${user.uid}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Upload API] Storage error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // 3. Save to User Profile in Supabase
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.dbId); 

    if (updateError) {
      console.error("[Upload API] Profile update error:", updateError);
      return NextResponse.json({ error: "Failed to update profile picture" }, { status: 500 });
    }

    // 4. Sync to Firestore (to keep them in sync if needed)
    try {
      const { adminDb } = await import("@/lib/firebase/admin-db");
      await adminDb.collection("users").doc(user.uid).set({
        avatar_url: publicUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.error("[Upload API] Firestore sync non-fatal error:", fsErr);
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl 
    });
  } catch (err) {
    console.error("[Upload API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
