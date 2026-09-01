import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { resolveTopicUnlockMap } from "../../../../lib/topicUnlock";

// GET /api/student/dashboard - fetch all data for student dashboard
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const studentId = user.id;

  // 1. All meetings for this student (sorted asc for globalIndex mapping)
  const { data: meetings } = await supabaseAdmin
    .from("meetings")
    .select(`
      id, title, meeting_date, link_url, notes,
      session_count, session_number, series_id,
      progress_report, is_completed, completion_status,
      meeting_students!inner(student_id, has_joined)
    `)
    .eq("meeting_students.student_id", studentId)
    .order("meeting_date", { ascending: true });

  const now = new Date();
  const sortedMeetings = (meetings || []) as any[];
  sortedMeetings.forEach((m: any, idx: number) => { m.globalIndex = idx; });

  // Filter upcoming meetings based on visibility rules
  const visibleUpcomingMeetings = sortedMeetings.filter((m: any) => {
    const hasJoined = m.meeting_students[0]?.has_joined;

    // Remove if teacher has submitted report / marked completed
    if (m.is_completed) return false;

    // Remove if student missed class and 65 minutes have passed since meeting started
    const meetingTime = new Date(m.meeting_date).getTime();
    const isMissingAndExpired = !hasJoined && now.getTime() > meetingTime + (65 * 60 * 1000);
    if (isMissingAndExpired) return false;

    return true;
  });

  const upcomingMeetings = visibleUpcomingMeetings.slice(0, 3);
  const pastMeetings = sortedMeetings.filter(
    (m: any) => m.is_completed || new Date(m.meeting_date).getTime() + 60 * 60 * 1000 <= now.getTime()
  );

  // 2. Assigned modules
  const { data: studentModules } = await supabaseAdmin
    .from("student_modules")
    .select(`module_id, modules(id, title, description, level)`)
    .eq("student_id", studentId)
    .order("module_id", { ascending: true });

  const moduleIds: number[] = ((studentModules || []) as any[]).map((sm: any) => sm.module_id);

  // 3. Quiz scores — fetched early so unlock logic can reference them
  const { data: quizAttempts } = await supabaseAdmin
    .from("quiz_attempts")
    .select(`id, quiz_id, score, total_questions, attempts_count, created_at, quizzes(title, topic_id, topics(title))`)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const attemptedQuizIds = new Set(((quizAttempts || []) as any[]).map((qa: any) => qa.quiz_id));

  let modulesWithTopics: any[] = [];

  if (moduleIds.length > 0) {
    // Resolve unlock status via centralised function
    const unlockMap = await resolveTopicUnlockMap(studentId, moduleIds);

    const { data: topics } = await supabaseAdmin
      .from("topics")
      .select("id, module_id, title, order_index, description, project_link, engine_topic_id, status, lesson_content")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true });

    const { data: quizzes } = await supabaseAdmin
      .from("quizzes")
      .select("id, topic_id, title")
      .in("topic_id", ((topics || []) as any[]).map((t: any) => t.id));

    modulesWithTopics = ((studentModules || []) as any[]).map((sm: any) => {
      const mod = sm.modules;
      const modTopics = ((topics || []) as any[])
        .filter((t: any) => t.module_id === sm.module_id)
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((t: any) => {
          const quiz = ((quizzes || []) as any[]).find((q: any) => q.topic_id === t.id);
          // Use centralised unlock map (covers join + engine completion)
          const isUnlocked = unlockMap.get(t.id)?.isUnlocked ?? false;
          return { ...t, quiz, isUnlocked };
        });

      const unlockedCount = modTopics.filter((t: any) => t.isUnlocked).length;
      const isModuleLocked = unlockedCount === 0;
      const isModuleActive = unlockedCount > 0 && unlockedCount < modTopics.length;
      const isModuleComplete = modTopics.length > 0 && unlockedCount === modTopics.length;

      return { ...mod, topics: modTopics, isModuleLocked, isModuleActive, isModuleComplete };
    });
  }

  // 4. Active announcements
  const now2 = new Date().toISOString();
  const { data: announcements } = await supabaseAdmin
    .from("announcements")
    .select("id, content, expires_at")
    .gt("expires_at", now2)
    .order("created_at", { ascending: false })
    .limit(1);

  // 5. Engine lesson progress (XP + quiz scores from engine)
  const { data: topicProgress } = await supabaseAdmin
    .from("topic_progress")
    .select("xp_earned, best_quiz_score, engine_topic_id, completed_at, topic_id, topics(title)")
    .eq("student_id", studentId)
    .order("completed_at", { ascending: false });

  const engineXpTotal = ((topicProgress || []) as any[]).reduce(
    (sum: number, tp: any) => sum + (typeof tp.xp_earned === "number" ? tp.xp_earned : 0),
    0
  );
  const completedEngineTopics = ((topicProgress || []) as any[]).length;

  const studentName = user.user_metadata?.full_name || "Siswa";
  const firstName = studentName.split(" ")[0];

  return NextResponse.json({
    upcomingMeetings,
    pastMeetings,
    modules: modulesWithTopics,
    quizAttempts: quizAttempts || [],
    announcement: announcements?.[0]?.content || null,
    studentName: firstName,
    engineXpTotal,
    completedEngineTopics,
    topicProgress: topicProgress || [],
  });
}
