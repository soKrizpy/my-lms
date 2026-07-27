import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("meetings")
    .select(`
      id,
      title,
      meeting_date,
      link_url,
      notes,
      session_count,
      created_at,
      meeting_students (
        student_id,
        students (
          full_name,
          email_or_phone
        )
      )
    `)
    .order("meeting_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format data
  const meetings = data.map((meet: any) => ({
    id: meet.id,
    title: meet.title,
    meeting_date: meet.meeting_date,
    link_url: meet.link_url,
    notes: meet.notes,
    session_count: meet.session_count,
    created_at: meet.created_at,
    students: meet.meeting_students.map((ms: any) => ({
      id: ms.student_id,
      name: ms.students?.full_name || "Unknown",
      contact: ms.students?.email_or_phone || "",
    })),
  }));

  return NextResponse.json(meetings);
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { title, meetingDate, linkUrl, notes, sessionCount, studentIds } = body;

    if (!title || !meetingDate) {
      return NextResponse.json({ error: "Judul dan Tanggal wajib diisi." }, { status: 400 });
    }

    // Insert meeting
    const { data: meetingData, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .insert({
        title,
        meeting_date: meetingDate, // Should be ISO string
        link_url: linkUrl || null,
        notes: notes || null,
        session_count: sessionCount ? parseInt(sessionCount, 10) : 1,
      })
      .select()
      .single();

    if (meetingError) {
      return NextResponse.json({ error: meetingError.message }, { status: 500 });
    }

    // Assign students
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      const rows = studentIds.map((studentId: string) => ({
        meeting_id: meetingData.id,
        student_id: studentId,
      }));
      const { error: smError } = await supabaseAdmin.from("meeting_students").insert(rows);
      if (smError) console.error("Error assigning students to meeting:", smError.message);
    }

    return NextResponse.json({ success: true, meeting: meetingData }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan." }, { status: 500 });
  }
}
