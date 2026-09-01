import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { meetingId } = await request.json() as { meetingId: number };

  if (!meetingId) {
    return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Mark the student as joined
  const { error } = await supabaseAdmin
    .from("meeting_students")
    .update({ has_joined: true })
    .eq("meeting_id", meetingId)
    .eq("student_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Determine which topic was unlocked by this join ──────────────────────
  // Find the global index of this meeting among all meetings for this student
  const { data: allMeetings } = await supabaseAdmin
    .from("meetings")
    .select("id, meeting_date, meeting_students!inner(student_id)")
    .eq("meeting_students.student_id", user.id)
    .order("meeting_date", { ascending: true });

  const meetingIndex = (allMeetings || []).findIndex((m: any) => m.id === meetingId);

  // Get all topics for this student (same ordering as topicUnlock.ts)
  const { data: studentModules } = await supabaseAdmin
    .from("student_modules")
    .select("module_id")
    .eq("student_id", user.id)
    .order("module_id", { ascending: true });

  const moduleIds = ((studentModules || []) as any[]).map((sm: any) => sm.module_id as number);
  let unlockedTopic: {
    id: number;
    title: string;
    engine_topic_id: string | null;
    canStartEngine: boolean;
  } | null = null;

  if (moduleIds.length > 0 && meetingIndex >= 0) {
    const { data: topics } = await supabaseAdmin
      .from("topics")
      .select("id, title, engine_topic_id, status, lesson_content")
      .in("module_id", moduleIds)
      .order("module_id", { ascending: true })
      .order("order_index", { ascending: true });

    const topicList = (topics || []) as any[];
    const totalTopics = topicList.length;
    const topicIndex = totalTopics > 0 ? meetingIndex % totalTopics : meetingIndex;
    const topic = topicList[topicIndex];

    if (topic) {
      // canStartEngine: engine_topic_id exists AND lesson is available
      // (published status OR no lesson_content = uses filesystem JSON directly)
      const canStartEngine =
        Boolean(topic.engine_topic_id) &&
        (topic.status === "published" || topic.lesson_content === null || topic.lesson_content === undefined);

      unlockedTopic = {
        id: topic.id as number,
        title: topic.title as string,
        engine_topic_id: (topic.engine_topic_id as string) ?? null,
        canStartEngine,
      };
    }
  }

  return NextResponse.json({ success: true, unlockedTopic });
}
