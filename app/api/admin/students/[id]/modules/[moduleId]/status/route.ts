import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { ModuleStatus } from "@/lib/lmsData";

// Request body
interface StatusRequestBody {
  action: "pause" | "activate";
}

// Response shapes
interface StatusResponse {
  success: true;
  status: ModuleStatus;
}

interface ErrorResponse {
  error: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { id: studentId, moduleId } = await params;
    const moduleIdNum = Number(moduleId);

    // --- Validate body ---
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ErrorResponse>(
        { error: "Action tidak valid." },
        { status: 400 }
      );
    }

    const action = (body as any)?.action;
    if (action !== "pause" && action !== "activate") {
      return NextResponse.json<ErrorResponse>(
        { error: "Action tidak valid." },
        { status: 400 }
      );
    }

    // --- Check record existence ---
    const { data: existing, error: existsError } = await supabase
      .from("student_modules")
      .select("student_id, module_id, status")
      .eq("student_id", studentId)
      .eq("module_id", moduleIdNum)
      .maybeSingle();

    if (existsError) {
      return NextResponse.json<ErrorResponse>(
        { error: existsError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json<ErrorResponse>(
        { error: "Penugasan modul tidak ditemukan." },
        { status: 404 }
      );
    }

    // --- Perform action ---
    if (action === "pause") {
      const { error: updateError } = await supabase
        .from("student_modules")
        .update({ status: "paused" })
        .eq("student_id", studentId)
        .eq("module_id", moduleIdNum);

      if (updateError) {
        return NextResponse.json<ErrorResponse>(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<StatusResponse>({ success: true, status: "paused" });
    }

    // action === "activate": use RPC for atomic transaction
    const { error: rpcError } = await supabase.rpc("activate_learning_path", {
      p_student_id: studentId,
      p_module_id: moduleIdNum,
    });

    if (rpcError) {
      return NextResponse.json<ErrorResponse>(
        { error: rpcError.message },
        { status: 500 }
      );
    }

    return NextResponse.json<StatusResponse>({ success: true, status: "active" });
  } catch (error: any) {
    return NextResponse.json<ErrorResponse>(
      { error: error.message ?? "Internal server error." },
      { status: 500 }
    );
  }
}
