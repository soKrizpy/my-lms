import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { meetingId } = await request.json();

  if (!meetingId) {
    return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  
  const { error } = await supabaseAdmin
    .from("meeting_students")
    .update({ has_joined: true })
    .eq("meeting_id", meetingId)
    .eq("student_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
