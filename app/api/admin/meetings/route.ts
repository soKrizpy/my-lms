import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

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
      series_id,
      session_number,
      progress_report,
      is_completed,
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
    series_id: meet.series_id,
    session_number: meet.session_number,
    progress_report: meet.progress_report,
    is_completed: meet.is_completed,
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

    const count = sessionCount ? parseInt(sessionCount, 10) : 1;
    const seriesId = uuidv4();
    const baseDate = new Date(meetingDate);

    for (let i = 0; i < count; i++) {
      // Add 7 days per session
      const currentMeetingDate = new Date(baseDate);
      currentMeetingDate.setDate(currentMeetingDate.getDate() + (i * 7));

      // Insert meeting
      const { data: meetingData, error: meetingError } = await supabaseAdmin
        .from("meetings")
        .insert({
          title,
          meeting_date: currentMeetingDate.toISOString(),
          link_url: linkUrl || null,
          notes: notes || null,
          session_count: count,
          series_id: seriesId,
          session_number: i + 1,
        })
        .select()
        .single();

      if (meetingError) {
        console.error("Error creating meeting row:", meetingError);
        continue;
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
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { id, title, meetingDate, linkUrl, notes, studentIds, editMode, seriesId, sessionNumber } = body;

    if (!id || !title || !meetingDate) {
      return NextResponse.json({ error: "Data wajib tidak lengkap." }, { status: 400 });
    }

    const baseDate = new Date(meetingDate);

    if (editMode === "single" || !seriesId) {
      // 1. Update meeting details
      const { error: updateError } = await supabaseAdmin
        .from("meetings")
        .update({
          title,
          meeting_date: baseDate.toISOString(),
          link_url: linkUrl || null,
          notes: notes || null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // 2. Update students (delete all then insert)
      await supabaseAdmin.from("meeting_students").delete().eq("meeting_id", id);
      if (studentIds && studentIds.length > 0) {
        const rows = studentIds.map((sId: string) => ({ meeting_id: id, student_id: sId }));
        await supabaseAdmin.from("meeting_students").insert(rows);
      }
    } else if (editMode === "series") {
      // Update all future meetings in the series (including this one)
      // We query all meetings in the series that have session_number >= current session_number
      const { data: futureMeetings, error: fetchError } = await supabaseAdmin
        .from("meetings")
        .select("id, session_number")
        .eq("series_id", seriesId)
        .gte("session_number", sessionNumber)
        .order("session_number", { ascending: true });

      if (fetchError) throw fetchError;

      // Update them one by one to adjust the dates +7 days relative to baseDate
      let offset = 0;
      for (const m of futureMeetings) {
        const newDate = new Date(baseDate);
        newDate.setDate(newDate.getDate() + (offset * 7));

        await supabaseAdmin
          .from("meetings")
          .update({
            title,
            meeting_date: newDate.toISOString(),
            link_url: linkUrl || null,
            notes: notes || null,
          })
          .eq("id", m.id);

        await supabaseAdmin.from("meeting_students").delete().eq("meeting_id", m.id);
        if (studentIds && studentIds.length > 0) {
          const rows = studentIds.map((sId: string) => ({ meeting_id: m.id, student_id: sId }));
          await supabaseAdmin.from("meeting_students").insert(rows);
        }

        offset++;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const editMode = searchParams.get("editMode");
    const seriesId = searchParams.get("seriesId");
    const sessionNumber = searchParams.get("sessionNumber");

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    if (editMode === "series" && seriesId && sessionNumber) {
      const { error } = await supabaseAdmin
        .from("meetings")
        .delete()
        .eq("series_id", seriesId)
        .gte("session_number", sessionNumber);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from("meetings").delete().eq("id", id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { id, progressReport, completionStatus } = body;

    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("meetings")
      .update({
        progress_report: progressReport || "",
        is_completed: true,
        completion_status: completionStatus || 'selesai'
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan." }, { status: 500 });
  }
}
