import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withAuth, UserContext } from "@/lib/auth/with-auth";
import { adminDb } from "@/lib/firebase/admin-db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  name: string;
  avatar_url: string | null;
  onboarding_done: boolean;
  comfort_level: number;
}

type ProfilePatchPayload = Partial<
  Pick<
    ProfileRow,
    "name" | "avatar_url" | "onboarding_done" | "comfort_level"
  >
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function syncProfileToFirestore(
  firebaseUid: string,
  data: ProfilePatchPayload
): Promise<void> {
  try {
    await adminDb
      .collection("users")
      .doc(firebaseUid)
      .set(
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
  } catch (err) {
    console.error("[syncProfileToFirestore] Firestore sync failed:", err);
  }
}

// ─── GET /api/profile ─────────────────────────────────────────────────────────

export const GET = withAuth(async (request: NextRequest, user: UserContext) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.dbId)
      .single();

    if (error) {
      console.error("[GET /api/profile] Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[GET /api/profile] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ─── PATCH /api/profile ───────────────────────────────────────────────────────

export const PATCH = withAuth(async (request: NextRequest, user: UserContext) => {
  try {
    const body = await request.json();
    const allowedFields: (keyof ProfilePatchPayload)[] = [
      "name",
      "avatar_url",
      "onboarding_done",
      "comfort_level"
    ];

    const updatePayload: ProfilePatchPayload = {};
    for (const field of allowedFields) {
      if (field in body) {
        updatePayload[field] = body[field];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    if (
      updatePayload.comfort_level !== undefined &&
      (updatePayload.comfort_level < 1 || updatePayload.comfort_level > 5)
    ) {
      return NextResponse.json(
        { error: "comfort_level must be between 1 and 5" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        ...updatePayload,
      })
      .eq("id", user.dbId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/profile] Supabase error:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Sync to Firestore using ORIGINAL firebaseUid from user context
    await syncProfileToFirestore(user.uid, updatePayload);

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/profile] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
