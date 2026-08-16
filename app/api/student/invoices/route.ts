import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET() {
  // 1. Validate auth via RLS-aware client
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Query with service-role admin client so RLS on invoices table doesn't block the read
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("*")
    .eq("student_id", user.id)
    .in("status", ["sent", "paid"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
