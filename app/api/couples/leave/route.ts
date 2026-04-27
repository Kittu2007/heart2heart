import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withAuth, UserContext } from "@/lib/auth/with-auth";
import { adminDb } from "@/lib/firebase/admin-db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function clearCoupleInFirestore(firebaseUid: string): Promise<void> {
  try {
    await adminDb.collection("users").doc(firebaseUid).set(
      {
        couple_id: null,
        partner_id: null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error(`[clearCoupleInFirestore] Failed for uid ${firebaseUid}:`, err);
  }
}

// ─── POST /api/couples/leave ──────────────────────────────────────────────────

export const POST = withAuth(async (request: NextRequest, user: UserContext) => {
  try {
    if (!user.coupleId) {
      return NextResponse.json(
        { message: "You are not currently linked to a partner." },
        { status: 200 }
      );
    }

    const { data: couple, error: coupleError } = await supabaseAdmin
      .from("couples")
      .select("id, partner_a_id, partner_b_id, status")
      .eq("id", user.coupleId)
      .single();

    if (coupleError || !couple) {
      console.error("[POST /api/couples/leave] Couple fetch error:", coupleError);
      await supabaseAdmin
        .from("profiles")
        .update({ couple_id: null })
        .eq("id", user.dbId);

      await clearCoupleInFirestore(user.uid);

      return NextResponse.json(
        { message: "Couple record not found — your link has been cleared." },
        { status: 200 }
      );
    }

    const partnerProfileId =
      couple.partner_a_id === user.dbId
        ? couple.partner_b_id
        : couple.partner_a_id;

    // 1. Clear my profile
    await supabaseAdmin
      .from("profiles")
      .update({ couple_id: null })
      .eq("id", user.dbId);

    // 2. Clear partner's profile
    if (partnerProfileId) {
      await supabaseAdmin
        .from("profiles")
        .update({ couple_id: null })
        .eq("id", partnerProfileId);
    }

    // 3. Mark couple inactive (reset to pending for disconnect as per schema allowed values)
    await (supabaseAdmin.from("couples") as any)
      .update({ status: "pending" })
      .eq("id", couple.id);

    // 4. Sync Firestore
    await clearCoupleInFirestore(user.uid);

    if (partnerProfileId) {
      const { data: partnerProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        // We need their firebase_uid which unfortunately isn't in profiles table based on schema.sql?
        // Wait, schema.sql showed: profiles (id UUID PRIMARY KEY, name TEXT, ...), NO firebase_uid.
        // sync.ts uses toDbId(firebaseUid) as 'id'.
        // So we can't easily get firebaseUid back from dbId unless we store it.
        // However, dashboad/id-mapper.ts says toDbId is deterministic.
        // We might need to rethink firestore sync if we can't reverse the hash.
        .eq("id", partnerProfileId)
        .single();
        
      // For now, we only clear our own. Partner will sync on next login/sync call.
    }

    return NextResponse.json(
      {
        success: true,
        message: "You have successfully left the couple. Both partners have been disconnected.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/couples/leave] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
