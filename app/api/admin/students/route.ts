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

    // Determine dummy email if contact is a phone number (doesn't contain @)
    const email = contact.includes("@") ? contact : `${contact}@student.mylms.app`;

    // 1. Create auth user using Supabase Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: mpin,
      email_confirm: true,
      user_metadata: { full_name: fullName, is_student: true },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Insert into public.students
    const { error: studentError } = await supabaseAdmin
      .from("students")
      .insert({
        id: userId,
        email_or_phone: contact,
        full_name: fullName,
        grade,
        bio,
        mpin, // Plain text for admin export
      });

    if (studentError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    // 3. Assign initial modules if provided
    if (Array.isArray(moduleIds) && moduleIds.length > 0) {
      const studentModules = moduleIds.map((moduleId) => ({
        student_id: userId,
        module_id: moduleId,
      }));
      const { error: smError } = await supabaseAdmin
        .from("student_modules")
        .insert(studentModules);
      if (smError) console.error("Error assigning modules:", smError);
    }

    return NextResponse.json({ success: true, userId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan." }, { status: 500 });
  }
}
