import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { resolveTopicUnlockMap } from "../../../../lib/topicUnlock";

// GET /api/student/dashboard - fetch all data for student dashboard
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Dashboard: Auth failed", { authError });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.id;
    const now = new Date();
    
    console.log(`Dashboard: Fetching data for student ${studentId}`);

    // 1. All meetings for this student (sorted asc for globalIndex mapping)
    let meetings: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("meetings")
        .select(`
          id, title, meeting_date, link_url, notes,
          session_count, session_number, series_id,
          progress_report, is_completed, completion_status,
          meeting_students!inner(student_id, has_joined)
        `)
        .eq("meeting_students.student_id", studentId)
        .order("meeting_date", { ascending: true });

      if (error) {
        console.error("Error fetching meetings:", error);
      } else {
        meetings = data ?? [];
      }
    } catch (err) {
      console.error("Exception fetching meetings:", err);
      meetings = [];
    }

    const sortedMeetings = (meetings || []) as any[];
    sortedMeetings.forEach((m: any, idx: number) => {
      if (m) m.globalIndex = idx;
    });

    // Filter upcoming meetings based on visibility rules
    const visibleUpcomingMeetings = sortedMeetings.filter((m: any) => {
      if (!m) return false;

      const hasJoined = m.meeting_students?.[0]?.has_joined;

      // Remove if teacher has submitted report / marked completed
      if (m.is_completed) return false;

      // Remove if student missed class and 65 minutes have passed since meeting started
      const meetingTime = new Date(m.meeting_date).getTime();
      const isMissingAndExpired = !hasJoined && now.getTime() > meetingTime + (65 * 60 * 1000);
      if (isMissingAndExpired) return false;

      return true;
    });

    const upcomingMeetings = visibleUpcomingMeetings.slice(0, 3);
    const pastMeetings = sortedMeetings.filter((m: any) => {
      if (!m) return false;
      const meetingTimeMs = new Date(m.meeting_date ?? 0).getTime();
      return m.is_completed || meetingTimeMs + 60 * 60 * 1000 <= now.getTime();
    });

    // 2. Assigned modules
    let studentModules: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("student_modules")
        .select(`module_id, modules(id, title, description, level)`)
        .eq("student_id", studentId)
        .order("module_id", { ascending: true });

      if (error) {
        console.error("Error fetching student modules:", error);
      } else {
        studentModules = data ?? [];
      }
    } catch (err) {
      console.error("Exception fetching student modules:", err);
      studentModules = [];
    }

    const moduleIds: number[] = ((studentModules || []) as any[])
      .map((sm: any) => sm?.module_id)
      .filter((id: any): id is number => typeof id === "number");

    // 3. Quiz scores — fetched early so unlock logic can reference them
    let quizAttempts: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("quiz_attempts")
        .select(`id, quiz_id, score, total_questions, attempts_count, created_at, quizzes(title, topic_id, topics(title))`)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quiz attempts:", error);
      } else {
        quizAttempts = data ?? [];
      }
    } catch (err) {
      console.error("Exception fetching quiz attempts:", err);
      quizAttempts = [];
    }

    const attemptedQuizIds = new Set(((quizAttempts || []) as any[]).map((qa: any) => qa?.quiz_id));

    let modulesWithTopics: any[] = [];

    if (moduleIds.length > 0) {
      // Resolve unlock status via centralised function
      let unlockMap: Map<number, any> = new Map();
      try {
        unlockMap = await resolveTopicUnlockMap(studentId, moduleIds);
      } catch (err) {
        console.error("Error resolving topic unlock map:", err);
        unlockMap = new Map();
      }

      // 4. Topics Query
      let topics: any[] = [];
      try {
        const { data, error } = await supabaseAdmin
          .from("topics")
          .select("id, module_id, title, order_index, description, project_link, engine_topic_id, status, lesson_content")
          .in("module_id", moduleIds)
          .order("order_index", { ascending: true });

        if (error) {
          console.error("Error fetching topics:", error);
        } else {
          topics = data ?? [];
        }
      } catch (err) {
        console.error("Exception fetching topics:", err);
        topics = [];
      }

      // 5. Quizzes Query
      let quizzes: any[] = [];
      if (topics.length > 0) {
        try {
          const topicIds = (topics || []).map((t: any) => t?.id).filter((id: any): id is number => typeof id === "number");
          if (topicIds.length > 0) {
            const { data, error } = await supabaseAdmin
              .from("quizzes")
              .select("id, topic_id, title")
              .in("topic_id", topicIds);

            if (error) {
              console.error("Error fetching quizzes:", error);
            } else {
              quizzes = data ?? [];
            }
          }
        } catch (err) {
          console.error("Exception fetching quizzes:", err);
          quizzes = [];
        }
      }

      // 6. Module Assembly with safe null-coalescing
      modulesWithTopics = ((studentModules || []) as any[])
        .map((sm: any) => {
          if (!sm) return null;

          const mod = sm?.modules;
          if (!mod) return null;

          const modTopics = ((topics || []) as any[])
            .filter((t: any) => t && t.module_id === sm.module_id)
            .sort((a: any, b: any) => (a?.order_index ?? 0) - (b?.order_index ?? 0))
            .map((t: any) => {
              if (!t) return null;

              const quiz = ((quizzes || []) as any[]).find((q: any) => q && q.topic_id === t.id);
              // Use centralised unlock map (covers join + engine completion)
              const isUnlocked = unlockMap.get(t.id)?.isUnlocked ?? false;
              return { ...t, quiz: quiz ?? null, isUnlocked };
            })
            .filter((t: any): t is object => t !== null);

          const unlockedCount = modTopics.filter((t: any) => t?.isUnlocked).length;
          const isModuleLocked = unlockedCount === 0;
          const isModuleActive = unlockedCount > 0 && unlockedCount < modTopics.length;
          const isModuleComplete = modTopics.length > 0 && unlockedCount === modTopics.length;

          return {
            ...mod,
            topics: modTopics,
            isModuleLocked,
            isModuleActive,
            isModuleComplete,
          };
        })
        .filter((m: any): m is object => m !== null);
    }

    // 7. Active announcements
    let announcement: string | null = null;
    try {
      const now2 = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("announcements")
        .select("id, content, expires_at")
        .gt("expires_at", now2)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching announcements:", error);
      } else {
        announcement = data?.[0]?.content ?? null;
      }
    } catch (err) {
      console.error("Exception fetching announcements:", err);
      announcement = null;
    }

    // 8. Engine lesson progress (XP + quiz scores from engine)
    let topicProgress: any[] = [];
    let engineXpTotal = 0;
    let completedEngineTopics = 0;

    try {
      const { data, error } = await supabaseAdmin
        .from("topic_progress")
        .select("xp_earned, best_quiz_score, engine_topic_id, completed_at, topic_id, topics(title)")
        .eq("student_id", studentId)
        .order("completed_at", { ascending: false });

      if (error) {
        console.error("Error fetching topic progress:", error);
      } else {
        topicProgress = data ?? [];
        engineXpTotal = (topicProgress || []).reduce(
          (sum: number, tp: any) => sum + (typeof tp?.xp_earned === "number" ? tp.xp_earned : 0),
          0
        );
        completedEngineTopics = topicProgress.length;
      }
    } catch (err) {
      console.error("Exception fetching topic progress:", err);
      topicProgress = [];
      engineXpTotal = 0;
      completedEngineTopics = 0;
    }

    const studentName = user.user_metadata?.full_name || "Siswa";
    const firstName = studentName.split(" ")[0];

    // Validate and sanitize response structure before returning
    const responsePayload = {
      upcomingMeetings: Array.isArray(upcomingMeetings) ? upcomingMeetings : [],
      pastMeetings: Array.isArray(pastMeetings) ? pastMeetings : [],
      modules: Array.isArray(modulesWithTopics) ? modulesWithTopics : [],
      quizAttempts: Array.isArray(quizAttempts) ? quizAttempts : [],
      announcement: announcement ?? null,
      studentName: firstName || "Siswa",
      engineXpTotal: typeof engineXpTotal === "number" ? engineXpTotal : 0,
      completedEngineTopics: typeof completedEngineTopics === "number" ? completedEngineTopics : 0,
      topicProgress: Array.isArray(topicProgress) ? topicProgress : [],
    };

    console.log(`Dashboard: Success - student ${studentId}, modules: ${responsePayload.modules.length}, xp: ${responsePayload.engineXpTotal}`);
    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error("Dashboard API fatal error:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Return partial/default data rather than crashing to prevent Server Component render errors
    const fallbackResponse = {
      upcomingMeetings: [],
      pastMeetings: [],
      modules: [],
      quizAttempts: [],
      announcement: null,
      studentName: "Siswa",
      engineXpTotal: 0,
      completedEngineTopics: 0,
      topicProgress: [],
    };
    
    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}
