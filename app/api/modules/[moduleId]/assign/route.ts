import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const resolvedParams = await params;
    const moduleId = Number(resolvedParams.moduleId);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: "Invalid module ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: "studentIds must be an array" },
        { status: 400 }
      );
    }

    // First delete existing assignments for this module
    const { error: deleteError } = await supabaseAdmin
      .from("student_modules")
      .delete()
      .eq("module_id", moduleId);

    if (deleteError) throw deleteError;

    // Then insert new assignments if there are any
    if (studentIds.length > 0) {
      const rows = studentIds.map((id: string) => ({
        student_id: id,
        module_id: moduleId,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("student_modules")
        .insert(rows);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to assign module" },
      { status: 500 }
    );
  }
}
