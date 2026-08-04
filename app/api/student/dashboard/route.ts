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
      progress_report, is_completed, completion_status,
      meeting_students!inner(student_id, has_joined)
    `)
    .eq("meeting_students.student_id", studentId)
    .order("meeting_date", { ascending: true });

  const now = new Date();
  const sortedMeetings = meetings || [];
  sortedMeetings.forEach((m: any, idx: number) => m.globalIndex = idx);
  
  // Filter upcoming meetings based on visibility rules
  const visibleUpcomingMeetings = sortedMeetings.filter(m => {
    const hasJoined = m.meeting_students[0]?.has_joined;
    
    // 1. Remove if teacher has submitted report / marked completed
    if (m.is_completed) return false;

    // 2. Remove if student missed class and 65 minutes have passed since meeting started (1 hr duration + 5 mins)
    const meetingTime = new Date(m.meeting_date).getTime();
    const isMissingAndExpired = !hasJoined && now.getTime() > meetingTime + (65 * 60 * 1000);
    if (isMissingAndExpired) return false;

    return true;
  });

  const upcomingMeetings = visibleUpcomingMeetings.slice(0, 3);

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

    let globalTopicIndex = 0;

    modulesWithTopics = (studentModules || []).map((sm: any) => {
      const mod = sm.modules;
      const modTopics = (topics || [])
        .filter((t: any) => t.module_id === sm.module_id)
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((t: any) => {
          const quiz = (quizzes || []).find((q: any) => q.topic_id === t.id);
          const correspondingMeeting = sortedMeetings.find((m: any) => m.globalIndex === globalTopicIndex);
          const isUnlocked = correspondingMeeting?.meeting_students?.[0]?.has_joined || false;
          
          globalTopicIndex++;
          return { ...t, quiz, isUnlocked };
        });

      // A module is "active" if it has at least one unlocked topic but isn't fully unlocked
      const unlockedCount = modTopics.filter((t: any) => t.isUnlocked).length;
      const isModuleLocked = unlockedCount === 0;
      const isModuleActive = unlockedCount > 0 && unlockedCount < modTopics.length;
      const isModuleComplete = modTopics.length > 0 && unlockedCount === modTopics.length;

      return { ...mod, topics: modTopics, isModuleLocked, isModuleActive, isModuleComplete };
    });
  }

  // 3. Quiz scores
  const { data: quizAttempts } = await supabaseAdmin
    .from("quiz_attempts")
    .select(`id, quiz_id, score, total_questions, attempts_count, created_at, quizzes(title, topic_id, topics(title))`)
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

  const studentName = user.user_metadata?.full_name || "Siswa";
  // take only first name for casual greeting
  const firstName = studentName.split(" ")[0];

  return NextResponse.json({
    upcomingMeetings,
    pastMeetings,
    modules: modulesWithTopics,
    quizAttempts: quizAttempts || [],
    announcement: announcements?.[0]?.content || null,
    studentName: firstName,
  });
}
