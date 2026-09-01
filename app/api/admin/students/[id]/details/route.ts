import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../../lib/supabaseAdmin";
import { resolveTopicUnlockMap } from "../../../../../../lib/topicUnlock";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id: studentId } = await params;

    // 1. Student profile
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, email_or_phone, full_name, grade, bio, mpin, created_at")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
    }

    // 2. Assigned modules
    const { data: studentModules } = await supabaseAdmin
      .from("student_modules")
      .select("module_id, modules(id, title, description)")
      .eq("student_id", studentId)
      .order("module_id", { ascending: true });

    const moduleIds: number[] = ((studentModules || []) as any[]).map((sm: any) => sm.module_id);

    let modulesWithTopics: any[] = [];

    if (moduleIds.length > 0) {
      // Centralised unlock logic
      const unlockMap = await resolveTopicUnlockMap(studentId, moduleIds);

      const { data: topics } = await supabaseAdmin
        .from("topics")
        .select("id, module_id, title, order_index, description, project_link, engine_topic_id")
        .in("module_id", moduleIds)
        .order("order_index", { ascending: true });

      const topicIds = ((topics || []) as any[]).map((t: any) => t.id);
      const { data: quizzes } = await supabaseAdmin
        .from("quizzes")
        .select("id, topic_id, title")
        .in("topic_id", topicIds);

      const { data: attempts } = await supabaseAdmin
        .from("quiz_attempts")
        .select("id, quiz_id, score, total_questions, created_at, attempts_count")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      modulesWithTopics = ((studentModules || []) as any[]).map((sm: any) => {
        const mod = sm.modules;
        const modTopics = ((topics || []) as any[])
          .filter((t: any) => t.module_id === sm.module_id)
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((t: any) => {
            const quiz = ((quizzes || []) as any[]).find((q: any) => q.topic_id === t.id);
            const isUnlocked = unlockMap.get(t.id)?.isUnlocked ?? false;

            const bestAttempt = quiz
              ? ((attempts || []) as any[])
                  .filter((a: any) => a.quiz_id === quiz.id)
                  .sort((a: any, b: any) => b.score - a.score)[0] || null
              : null;

            return {
              id: t.id,
              title: t.title,
              order_index: t.order_index,
              engine_topic_id: t.engine_topic_id ?? null,
              isUnlocked,
              quiz: quiz
                ? {
                    id: quiz.id,
                    title: quiz.title,
                    bestScore: bestAttempt?.score ?? null,
                    totalQuestions: bestAttempt?.total_questions ?? null,
                    attemptsCount: bestAttempt?.attempts_count ?? 0,
                  }
                : null,
            };
          });

        const completedCount = modTopics.filter((t: any) => t.isUnlocked).length;
        return {
          id: mod.id,
          title: mod.title,
          description: mod.description,
          topics: modTopics,
          completedCount,
          totalCount: modTopics.length,
        };
      });
    }

    // 3. All meetings this student is assigned to
    const { data: meetingRows } = await supabaseAdmin
      .from("meetings")
      .select(
        "id, title, meeting_date, is_completed, completion_status, progress_report, meeting_students!inner(student_id, has_joined)"
      )
      .eq("meeting_students.student_id", studentId)
      .order("meeting_date", { ascending: false });

    const meetings = ((meetingRows || []) as any[]).map((m: any) => ({
      id: m.id,
      title: m.title,
      meeting_date: m.meeting_date,
      is_completed: m.is_completed,
      completion_status: m.completion_status,
      progress_report: m.progress_report,
      has_joined: m.meeting_students?.[0]?.has_joined ?? false,
    }));

    // 4. All quiz attempts with topic/quiz titles
    const { data: quizAttempts } = await supabaseAdmin
      .from("quiz_attempts")
      .select(
        "id, quiz_id, score, total_questions, attempts_count, created_at, quizzes(title, topic_id, topics(title))"
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    const formattedAttempts = ((quizAttempts || []) as any[]).map((a: any) => ({
      id: a.id,
      quiz_id: a.quiz_id,
      score: a.score,
      total_questions: a.total_questions,
      attempts_count: a.attempts_count,
      created_at: a.created_at,
      quizTitle: a.quizzes?.title || "—",
      topicTitle: a.quizzes?.topics?.title || "—",
    }));

    return NextResponse.json({
      student,
      modules: modulesWithTopics,
      meetings,
      quizAttempts: formattedAttempts,
      certificates: [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan." },
      { status: 500 }
    );
  }
}
