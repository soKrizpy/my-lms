import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get sent or paid invoices for this student
  const { data, error } = await supabase
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
