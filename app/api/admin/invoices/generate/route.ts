import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { monthYear } = body; // Format: YYYY-MM

    if (!monthYear) {
      return NextResponse.json({ error: "Bulan dan tahun wajib diisi." }, { status: 400 });
    }

    // Determine start and end date for the month
    const [year, month] = monthYear.split("-");
    const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
    const endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23, 59, 59, 999));

    // Get all meetings in that month
    const { data: meetings, error: meetingsError } = await supabaseAdmin
      .from("meetings")
      .select(`
        id,
        meeting_students (
          student_id,
          has_joined
        )
      `)
      .gte("meeting_date", startDate.toISOString())
      .lte("meeting_date", endDate.toISOString());

    if (meetingsError) throw meetingsError;

    // Group by student
    const studentStats: Record<string, { total: number; attended: number }> = {};
    meetings.forEach((meeting: any) => {
      meeting.meeting_students.forEach((ms: any) => {
        if (!studentStats[ms.student_id]) {
          studentStats[ms.student_id] = { total: 0, attended: 0 };
        }
        studentStats[ms.student_id].total++;
        if (ms.has_joined) {
          studentStats[ms.student_id].attended++;
        }
      });
    });

    // Check existing invoices for this month
    const { data: existingInvoices, error: existingError } = await supabaseAdmin
      .from("invoices")
      .select("student_id")
      .eq("month_year", monthYear);
    
    if (existingError) throw existingError;

    const existingStudentIds = existingInvoices.map((inv: any) => inv.student_id);

    // Get default price and bank account (from the most recent invoice)
    const { data: lastInvoice } = await supabaseAdmin
      .from("invoices")
      .select("price_per_meeting, bank_account")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const defaultPrice = lastInvoice?.price_per_meeting || 0;
    const defaultBank = lastInvoice?.bank_account || "";

    // Prepare inserts
    const inserts: any[] = [];
    for (const studentId of Object.keys(studentStats)) {
      if (!existingStudentIds.includes(studentId)) {
        const stats = studentStats[studentId];
        inserts.push({
          student_id: studentId,
          month_year: monthYear,
          total_meetings: stats.total,
          attended_meetings: stats.attended,
          price_per_meeting: defaultPrice,
          total_amount: stats.attended * defaultPrice,
          bank_account: defaultBank,
          status: "draft",
        });
      }
    }

    if (inserts.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("invoices").insert(inserts);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, generated: inserts.length });
  } catch (error: any) {
    console.error("Generate invoice error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan saat membuat invoice." }, { status: 500 });
  }
}
