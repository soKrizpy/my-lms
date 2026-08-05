import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id: meetingId } = await params;

    // 1. Get the students in this meeting
    const { data: msData, error: msError } = await supabaseAdmin
      .from("meeting_students")
      .select("student_id")
      .eq("meeting_id", meetingId);

    if (msError || !msData || msData.length === 0) {
      return NextResponse.json({ topic: null });
    }

    const studentId = msData[0].student_id;

    // 2. Fetch all meetings for this student to calculate globalIndex
    const { data: allStudentMeetings, error: asmError } = await supabaseAdmin
      .from("meeting_students")
      .select("meeting_id, meetings(meeting_date)")
      .eq("student_id", studentId);

    if (asmError || !allStudentMeetings) {
      return NextResponse.json({ topic: null });
    }

    // Sort meetings by date
    const sortedMeetings = allStudentMeetings
      .map((asm: any) => ({
        id: asm.meeting_id,
        date: asm.meetings?.meeting_date ? new Date(asm.meetings.meeting_date).getTime() : 0,
      }))
      .sort((a, b) => a.date - b.date);

    const globalIndex = sortedMeetings.findIndex(m => String(m.id) === String(meetingId));

    if (globalIndex === -1) {
      return NextResponse.json({ topic: null });
    }

    // 3. Fetch all modules for this student — ordered consistently by module id
    const { data: studentModules, error: smError } = await supabaseAdmin
      .from("student_modules")
      .select("module_id, modules(id)")
      .eq("student_id", studentId)
      .order("module_id", { ascending: true });

    if (smError || !studentModules || studentModules.length === 0) {
      return NextResponse.json({ topic: null });
    }

    const moduleIds = studentModules.map(sm => sm.module_id);

    // 4. Fetch all topics for these modules with consistent order
    const { data: topics, error: topicsError } = await supabaseAdmin
      .from("topics")
      .select("id, module_id, title, description, project_link, order_index")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true });

    if (topicsError || !topics) {
      return NextResponse.json({ topic: null });
    }

    // Flatten topics in module_id order (ascending), then by order_index within each module
    const flattenedTopics: any[] = [];
    moduleIds.forEach(modId => {
      const modTopics = topics
        .filter(t => t.module_id === modId)
        .sort((a, b) => a.order_index - b.order_index);
      flattenedTopics.push(...modTopics);
    });

    const topic = flattenedTopics.length > 0
      ? flattenedTopics[globalIndex % flattenedTopics.length]
      : null;

    return NextResponse.json({ topic });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch topic" }, { status: 500 });
  }
}
