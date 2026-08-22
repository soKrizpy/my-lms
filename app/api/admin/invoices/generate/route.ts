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
    for (const meeting of meetings as any[]) {
      for (const ms of meeting.meeting_students) {
        if (!studentStats[ms.student_id]) {
          studentStats[ms.student_id] = { total: 0, attended: 0 };
        }
        studentStats[ms.student_id].total++;
        if (ms.has_joined) {
          studentStats[ms.student_id].attended++;
        }
      }
    }

    // Fetch full existing invoices for this month
    const { data: existingInvoices, error: existingError } = await supabaseAdmin
      .from("invoices")
      .select("id, student_id, status, price_per_meeting")
      .eq("month_year", monthYear);

    if (existingError) throw existingError;

    const existingByStudent: Record<string, { id: string; status: string; price_per_meeting: number }> = {};
    for (const inv of existingInvoices as any[]) {
      existingByStudent[inv.student_id] = {
        id: inv.id,
        status: inv.status,
        price_per_meeting: inv.price_per_meeting,
      };
    }

    // Get default price and bank account (from the most recent invoice)
    const { data: lastInvoice } = await supabaseAdmin
      .from("invoices")
      .select("price_per_meeting, bank_account")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const defaultPrice = (lastInvoice as any)?.price_per_meeting || 0;
    const defaultBank = (lastInvoice as any)?.bank_account || "";

    const inserts: any[] = [];
    const updatePromises: Promise<void>[] = [];

    for (const studentId of Object.keys(studentStats)) {
      const stats = studentStats[studentId];
      const existing = existingByStudent[studentId];

      if (!existing) {
        // No invoice yet — insert fresh
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
      } else if (existing.status === "draft") {
        // Draft invoice — refresh meeting counts only, preserve price/bank/status
        const invId = existing.id;
        const price = existing.price_per_meeting;
        const total = stats.total;
        const attended = stats.attended;
        updatePromises.push(
          (async (): Promise<void> => {
            const { error } = await supabaseAdmin
              .from("invoices")
              .update({
                total_meetings: total,
                attended_meetings: attended,
                total_amount: attended * price,
              })
              .eq("id", invId);
            if (error) throw error;
          })()
        );
      }
      // sent/paid invoices: skip entirely
    }

    if (inserts.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("invoices").insert(inserts);
      if (insertError) throw insertError;
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    return NextResponse.json({
      success: true,
      generated: inserts.length,
      updated: updatePromises.length,
    });
  } catch (error: any) {
    console.error("Generate invoice error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat membuat invoice." },
      { status: 500 }
    );
  }
}
