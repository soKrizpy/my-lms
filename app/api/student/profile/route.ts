import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import {
  AVATAR_MAP,
  TITLE_MAP,
  DEFAULT_AVATAR_ID,
  DEFAULT_TITLE_ID,
} from "../../../../lib/gamification/catalog";

// PATCH /api/student/profile - update equipped avatar and title
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { avatarId, titleId } = body;

    const studentId = user.id;
    const supabaseAdmin = getSupabaseAdmin();

    const updates: Record<string, string> = {};

    if (typeof avatarId === "string") {
      if (!AVATAR_MAP.has(avatarId)) {
        return NextResponse.json(
          { error: `Avatar ID '${avatarId}' tidak valid.` },
          { status: 400 }
        );
      }
      updates.avatar_id = avatarId;
    }

    if (typeof titleId === "string") {
      if (!TITLE_MAP.has(titleId)) {
        return NextResponse.json(
          { error: `Title ID '${titleId}' tidak valid.` },
          { status: 400 }
        );
      }
      updates.title_id = titleId;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada field yang diperbarui." },
        { status: 400 }
      );
    }

    // 1. Update students table
    try {
      const { error: dbError } = await supabaseAdmin
        .from("students")
        .update(updates)
        .eq("id", studentId);

      if (dbError) {
        console.warn("Could not update students table directly (might lack column):", dbError.message);
      }
    } catch (dbErr) {
      console.warn("Exception updating students table:", dbErr);
    }

    // 2. Dual-sync to user_metadata for resilient fallback
    try {
      await supabaseAdmin.auth.admin.updateUserById(studentId, {
        user_metadata: {
          ...user.user_metadata,
          avatar_id: updates.avatar_id || user.user_metadata?.avatar_id || DEFAULT_AVATAR_ID,
          title_id: updates.title_id || user.user_metadata?.title_id || DEFAULT_TITLE_ID,
        },
      });
    } catch (metaErr) {
      console.warn("Exception updating user_metadata:", metaErr);
    }

    return NextResponse.json({
      success: true,
      avatarId: updates.avatar_id || user.user_metadata?.avatar_id || DEFAULT_AVATAR_ID,
      titleId: updates.title_id || user.user_metadata?.title_id || DEFAULT_TITLE_ID,
    });
  } catch (err) {
    console.error("Profile update fatal error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menyimpan profil." },
      { status: 500 }
    );
  }
}
