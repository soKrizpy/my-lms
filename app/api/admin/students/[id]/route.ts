import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = params;

    // 1. Delete student records (student_modules, students) — cascading should handle some, but let's be safe.
    await supabaseAdmin.from("student_modules").delete().eq("student_id", id);
    await supabaseAdmin.from("students").delete().eq("id", id);
    await supabaseAdmin.from("profiles").delete().eq("id", id);

    // 2. Delete Auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw authError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete student" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = params;
    const body = await request.json();
    const { fullName, contact, mpin, grade, bio, moduleIds } = body;

    if (fullName) {
      await supabaseAdmin.from("profiles").update({ full_name: fullName }).eq("id", id);
      await supabaseAdmin.auth.admin.updateUserById(id, { user_metadata: { full_name: fullName } });
    }

    const studentUpdate: any = {};
    if (fullName) studentUpdate.full_name = fullName;
    if (contact) studentUpdate.email_or_phone = contact;
    if (mpin) {
      if (mpin.length !== 6) return NextResponse.json({ error: "MPIN harus 6 digit." }, { status: 400 });
      studentUpdate.mpin = mpin;
      await supabaseAdmin.auth.admin.updateUserById(id, { password: mpin });
    }
    if (grade !== undefined) studentUpdate.grade = grade;
    if (bio !== undefined) studentUpdate.bio = bio;

    if (Object.keys(studentUpdate).length > 0) {
      await supabaseAdmin.from("students").update(studentUpdate).eq("id", id);
    }

    if (moduleIds !== undefined) {
      await supabaseAdmin.from("student_modules").delete().eq("student_id", id);
      if (moduleIds.length > 0) {
        const inserts = moduleIds.map((modId: number) => ({ student_id: id, module_id: modId }));
        await supabaseAdmin.from("student_modules").insert(inserts);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update student" }, { status: 500 });
  }
}
