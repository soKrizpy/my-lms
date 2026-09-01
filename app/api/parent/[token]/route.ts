// app/api/parent/[token]/route.ts
// GET /api/parent/[token] — public, no auth required.
// Validates token, checks expiry, returns student progress + invoice for parent view.
// Deliberately excludes PII: no email, no MPIN, no phone number.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const admin = getSupabaseAdmin();

  // 1. Validate token
  const { data: link } = await admin
    .from('parent_links')
    .select('student_id, invoice_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: 'Link tidak ditemukan.' }, { status: 404 });
  }
  if (new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link sudah kadaluarsa.' }, { status: 410 });
  }

  const studentId = link.student_id as string;

  // 2. Student name + grade only (no PII)
  const { data: student } = await admin
    .from('students')
    .select('full_name, grade')
    .eq('id', studentId)
    .maybeSingle();

  // 3. Engine lesson progress — best quiz score per topic (no attempt count)
  const { data: topicProgress } = await admin
    .from('topic_progress')
    .select('engine_topic_id, xp_earned, best_quiz_score, completed_at, topics(title)')
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false });

  // 4. Completed meetings with teacher report (attendance + laporan guru)
  const { data: meetingRows } = await admin
    .from('meetings')
    .select(
      'id, title, meeting_date, is_completed, progress_report, meeting_students!inner(student_id, has_joined)'
    )
    .eq('meeting_students.student_id', studentId)
    .eq('is_completed', true)
    .order('meeting_date', { ascending: false });

  const meetings = ((meetingRows || []) as any[]).map((m: any) => ({
    id: m.id,
    title: m.title,
    meeting_date: m.meeting_date,
    has_joined: m.meeting_students?.[0]?.has_joined ?? false,
    progress_report: m.progress_report ?? null,
  }));

  // 5. Invoice (if link was created with one)
  let invoice = null;
  if (link.invoice_id) {
    const { data: inv } = await admin
      .from('invoices')
      .select(
        'month_year, total_meetings, attended_meetings, price_per_meeting, total_amount, status, bank_account'
      )
      .eq('id', link.invoice_id)
      .maybeSingle();
    invoice = inv ?? null;
  }

  // 6. Summary stats
  const tp = (topicProgress || []) as any[];
  const totalAttended = meetings.filter((m) => m.has_joined).length;
  const totalMeetings = meetings.length;
  const avgScore =
    tp.length > 0
      ? Math.round(tp.reduce((s, t) => s + (t.best_quiz_score || 0), 0) / tp.length)
      : 0;
  const totalXp = tp.reduce((s, t) => s + (t.xp_earned || 0), 0);

  return NextResponse.json({
    student: { full_name: student?.full_name ?? null, grade: student?.grade ?? null },
    topicProgress: tp,
    meetings,
    invoice,
    summary: { totalAttended, totalMeetings, avgScore, totalXp },
    expiresAt: link.expires_at,
  });
}
