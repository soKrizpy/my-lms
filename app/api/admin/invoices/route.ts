import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const monthYear = searchParams.get("monthYear"); // Format: YYYY-MM

  if (!monthYear) {
    return NextResponse.json({ error: "monthYear is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select(`
      *,
      students (
        full_name,
        email_or_phone
      )
    `)
    .eq("month_year", monthYear)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { id, price_per_meeting, bank_account, status, total_amount } = body;

    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("invoices")
      .update({
        price_per_meeting,
        bank_account,
        status,
        total_amount,
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan." }, { status: 500 });
  }
}
