import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { id } = await params;

  const { data: invoice, error: invError } = await supabaseAdmin
    .from("invoices")
    .select("student_id, month_year")
    .eq("id", id)
    .single();

  if (invError || !invoice) {
    return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  }

  const { student_id, month_year } = invoice as any;
  const [year, month] = (month_year as string).split("-");
  const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
  const endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23, 59, 59, 999));

  const { data: meetings, error: meetingsError } = await supabaseAdmin
    .from("meetings")
    .select("id, title, meeting_date, meeting_students!inner ( student_id, has_joined )")
    .eq("meeting_students.student_id", student_id)
    .gte("meeting_date", startDate.toISOString())
    .lte("meeting_date", endDate.toISOString())
    .order("meeting_date", { ascending: true });

  if (meetingsError) {
    return NextResponse.json({ error: meetingsError.message }, { status: 500 });
  }

  const rows = (meetings as any[]).map((m) => {
    const ms = m.meeting_students?.[0];
    return {
      meeting_id: m.id,
      title: m.title,
      meeting_date: m.meeting_date,
      has_joined: ms?.has_joined ?? false,
    };
  });

  return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
}