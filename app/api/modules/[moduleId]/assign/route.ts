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

    if (studentIds.length > 0) {
      // Determine which students already have an active module assigned
      // so new assignments don't clobber their active status
      const { data: existingActives } = await supabaseAdmin
        .from("student_modules")
        .select("student_id")
        .eq("status", "active")
        .in("student_id", studentIds);

      const alreadyActiveSet = new Set(
        (existingActives ?? []).map((r: any) => r.student_id as string)
      );

      // Build rows: new students get 'active' unless they already have an
      // active module elsewhere (in which case this assignment is 'paused').
      // For existing assignments to THIS module, upsert preserves their status.
      const rows = studentIds.map((id: string) => ({
        student_id: id,
        module_id: moduleId,
        status: alreadyActiveSet.has(id) ? "paused" : "active",
      }));

      // Upsert: preserves status for students already assigned to this module;
      // inserts with computed status for brand-new assignments.
      const { error: upsertError } = await supabaseAdmin
        .from("student_modules")
        .upsert(rows, { onConflict: "student_id,module_id" });

      if (upsertError) throw upsertError;

      // Remove assignments for students no longer in the list
      const { error: deleteError } = await supabaseAdmin
        .from("student_modules")
        .delete()
        .eq("module_id", moduleId)
        .not(
          "student_id",
          "in",
          `(${studentIds.map((id: string) => `'${id}'`).join(",")})`
        );

      if (deleteError) throw deleteError;
    } else {
      // Empty list — remove all assignments for this module
      const { error: deleteError } = await supabaseAdmin
        .from("student_modules")
        .delete()
        .eq("module_id", moduleId);

      if (deleteError) throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to assign module" },
      { status: 500 }
    );
  }
}
