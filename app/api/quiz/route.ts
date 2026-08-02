import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, question, optionA, optionB, optionC, optionD, correct } = body;
    
    if (!id || !question) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("quiz_questions").update({
      question_text: question,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correct,
    }).eq("id", id);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("quiz_questions").delete().eq("id", Number(id));
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
