import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("students")
    .select(`
      id,
      email_or_phone,
      full_name,
      grade,
      bio,
      mpin,
      created_at,
      student_modules (
        module_id,
        modules (
          title
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const students = data.map((student: any) => ({
    id: student.id,
    email_or_phone: student.email_or_phone,
    full_name: student.full_name,
    grade: student.grade,
    bio: student.bio,
    mpin: student.mpin,
    created_at: student.created_at,
    modules: student.student_modules.map((sm: any) => ({
      id: sm.module_id,
      name: sm.modules?.title || "Unknown Module",
    })),
  }));

  return NextResponse.json(students);
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { fullName, contact, mpin, grade, bio, moduleIds } = body;

    if (!contact || !mpin || !fullName) {
      return NextResponse.json({ error: "Nama, Kontak, dan MPIN wajib diisi." }, { status: 400 });
    }

    if (mpin.length !== 6) {
      return NextResponse.json({ error: "MPIN harus 6 digit." }, { status: 400 });
    }

    // Use dummy email for phone numbers
    const email = contact.includes("@") ? contact.trim() : `${contact.trim()}@student.mylms.app`;

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: mpin,
      email_confirm: true,
      user_metadata: { full_name: fullName, is_student: true },
    });

    if (authError) {
      const msg = authError.message.includes("already been registered")
        ? "Kontak ini sudah terdaftar sebagai siswa."
        : authError.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Gagal membuat akun auth — user null." }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Insert into profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        role: "student",
        full_name: fullName,
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: `Profile DB error: ${profileError.message}` }, { status: 500 });
    }

    // 3. Insert into public.students
    const { error: studentError } = await supabaseAdmin
      .from("students")
      .insert({
        id: userId,
        email_or_phone: contact.trim(),
        full_name: fullName,
        grade: grade || null,
        bio: bio || null,
        mpin,
      });

    if (studentError) {
      // Rollback: remove auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: `DB error: ${studentError.message}` }, { status: 500 });
    }

    // 3. Assign modules
    if (Array.isArray(moduleIds) && moduleIds.length > 0) {
      const rows = moduleIds.map((moduleId: number) => ({
        student_id: userId,
        module_id: moduleId,
      }));
      const { error: smError } = await supabaseAdmin.from("student_modules").insert(rows);
      if (smError) console.error("Module assign error:", smError.message);
    }

    return NextResponse.json({ success: true, userId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan." }, { status: 500 });
  }
}

