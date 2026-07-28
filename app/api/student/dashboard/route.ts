import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

// GET /api/student/dashboard - fetch all data for student dashboard
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const studentId = user.id;

  // 1. Upcoming meetings (next 3)
  const { data: meetings } = await supabaseAdmin
    .from("meetings")
    .select(`
      id, title, meeting_date, link_url, notes,
      session_count, session_number, series_id,
      progress_report, is_completed,
      meeting_students!inner(student_id)
    `)
    .eq("meeting_students.student_id", studentId)
    .order("meeting_date", { ascending: true });

  const now = new Date();
  const upcomingMeetings = (meetings || [])
    .filter(m => new Date(m.meeting_date).getTime() + 60 * 60 * 1000 > now.getTime() && !m.is_completed)
    .slice(0, 3);

  const pastMeetings = (meetings || []).filter(
    m => m.is_completed || new Date(m.meeting_date).getTime() + 60 * 60 * 1000 <= now.getTime()
  );

  // 2. Assigned modules with topics and quizzes
  const { data: studentModules } = await supabaseAdmin
    .from("student_modules")
    .select(`
      module_id,
      modules(id, title, description, level)
    `)
    .eq("student_id", studentId);

  const moduleIds = (studentModules || []).map((sm: any) => sm.module_id);

  let modulesWithTopics: any[] = [];
  if (moduleIds.length > 0) {
    const { data: topics } = await supabaseAdmin
      .from("topics")
      .select("id, module_id, title, order_index, description, project_link")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true });

    const { data: quizzes } = await supabaseAdmin
      .from("quizzes")
      .select("id, topic_id, title")
      .in("topic_id", (topics || []).map((t: any) => t.id));

    // Unlock topics based on meetings that have already started (meeting_date <= now).
    // This ensures clicking "Join" immediately reflects as an unlocked topic without
    // waiting for admin to submit a progress report.
    const nowMs = Date.now();
    const startedCount = (meetings || []).filter(
      m => new Date(m.meeting_date).getTime() <= nowMs
    ).length;

    modulesWithTopics = (studentModules || []).map((sm: any) => {
      const mod = sm.modules;
      const modTopics = (topics || [])
        .filter((t: any) => t.module_id === sm.module_id)
        .map((t: any, idx: number) => {
          const quiz = (quizzes || []).find((q: any) => q.topic_id === t.id);
          const isUnlocked = idx < startedCount;
          return { ...t, quiz, isUnlocked };
        });
      return { ...mod, topics: modTopics };
    });
  }

  // 3. Quiz scores
  const { data: quizAttempts } = await supabaseAdmin
    .from("quiz_attempts")
    .select(`id, quiz_id, score, total_questions, created_at, quizzes(title, topic_id, topics(title))`)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  // 4. Active announcements
  const now2 = new Date().toISOString();
  const { data: announcements } = await supabaseAdmin
    .from("announcements")
    .select("id, content, expires_at")
    .gt("expires_at", now2)
    .order("created_at", { ascending: false })
    .limit(1);

  return NextResponse.json({
    upcomingMeetings,
    pastMeetings,
    modules: modulesWithTopics,
    quizAttempts: quizAttempts || [],
    announcement: announcements?.[0]?.content || null,
  });
}
