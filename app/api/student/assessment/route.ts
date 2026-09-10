import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import {
  getAssessmentAttempts,
  getAssessmentQuestions,
  type AssessmentQuestionPublic,
} from "../../../../lib/lmsData";
import { resolveModuleCompletionMap } from "../../../../lib/moduleCompletion";

// GET /api/student/assessment?assessmentId=<number>
// Returns assessment questions (without correct_option) for a student to take.
export async function GET(request: Request) {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentId = user.id;

  // 2. Read and validate assessmentId query param
  const { searchParams } = new URL(request.url);
  const assessmentIdParam = searchParams.get("assessmentId");

  if (!assessmentIdParam) {
    return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });
  }

  const assessmentId = Number(assessmentIdParam);
  if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
    return NextResponse.json({ error: "Invalid assessmentId" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // 3. Fetch assessment record
  const { data: assessment, error: assessmentError } = await supabaseAdmin
    .from("module_assessments")
    .select("id, module_id, title, created_at")
    .eq("id", assessmentId)
    .maybeSingle();

  if (assessmentError) {
    console.error("GET /api/student/assessment: error fetching assessment", assessmentError);
    return NextResponse.json({ error: "Gagal memuat assessment." }, { status: 500 });
  }

  if (!assessment) {
    return NextResponse.json({ error: "Assessment tidak ditemukan." }, { status: 404 });
  }

  const moduleId: number = assessment.module_id;

  // 4. Verify student enrollment
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from("student_modules")
    .select("student_id")
    .eq("student_id", studentId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (enrollmentError) {
    console.error("GET /api/student/assessment: error checking enrollment", enrollmentError);
    return NextResponse.json({ error: "Gagal memverifikasi enrollment." }, { status: 500 });
  }

  if (!enrollment) {
    return NextResponse.json({ error: "Kamu tidak terdaftar di modul ini." }, { status: 403 });
  }

  // 5. Verify module completion
  const completionMap = await resolveModuleCompletionMap(studentId, [moduleId]);
  const completionResult = completionMap.get(moduleId);

  if (!completionResult?.isComplete) {
    return NextResponse.json(
      { error: "Selesaikan semua topik terlebih dahulu." },
      { status: 403 }
    );
  }

  // 6. Check attempt count — must be < 2
  const { data: attempts, error: attemptsError } = await getAssessmentAttempts(studentId, assessmentId);

  if (attemptsError) {
    console.error("GET /api/student/assessment: error fetching attempts", attemptsError);
    return NextResponse.json({ error: "Gagal memeriksa riwayat percobaan." }, { status: 500 });
  }

  if ((attempts ?? []).length >= 2) {
    return NextResponse.json(
      { error: "Semua percobaan sudah digunakan." },
      { status: 403 }
    );
  }

  // 7. Fetch questions
  const { data: questions, error: questionsError } = await getAssessmentQuestions(assessmentId);

  if (questionsError) {
    console.error("GET /api/student/assessment: error fetching questions", questionsError);
    return NextResponse.json({ error: "Gagal memuat soal." }, { status: 500 });
  }

  // 8. Strip correct_option before returning to the student
  const publicQuestions: AssessmentQuestionPublic[] = (questions ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ correct_option: _co, created_at: _ca, ...q }) => q
  );

  return NextResponse.json(publicQuestions);
}
