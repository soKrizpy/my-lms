import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan.") {
  return error instanceof Error ? error.message : fallback;
}

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("modules")
    .select("id, title, description, level")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const modules = (data ?? []).map((item) => {
    const record = item as {
      id: string;
      title?: string | null;
      name?: string | null;
      description?: string | null;
      level?: string | null;
    };

    return {
      id: record.id,
      name: record.title ?? record.name ?? "",
      description: record.description ?? null,
      level: record.level ?? "beginner",
    };
  });

  return NextResponse.json(modules);
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description : "";
    const level = typeof body?.level === "string" ? body.level : "beginner";

    if (!name) {
      return NextResponse.json(
        { error: "Nama modul wajib diisi." },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("modules")
      .insert([{ title: name, description, level }])
      .select("id, title, description, level")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const record = data as {
      id: string;
      title?: string | null;
      description?: string | null;
      level?: string | null;
    };

    return NextResponse.json(
      {
        id: record.id,
        name: record.title ?? name,
        description: record.description ?? description,
        level: record.level ?? level,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak valid." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const id = body?.id;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description : "";
    const level = typeof body?.level === "string" ? body.level : "beginner";

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID dan Nama modul wajib diisi." },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("modules")
      .update({ title: name, description, level })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Modul tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Permintaan tidak valid.") },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const moduleId = Number(idParam);

    if (!idParam || !Number.isFinite(moduleId)) {
      return NextResponse.json(
        { error: "Missing or invalid module ID" },
        { status: 400 },
      );
    }

    const { data: topics, error: topicsError } = await supabaseAdmin
      .from("topics")
      .select("id")
      .eq("module_id", moduleId);

    if (topicsError) throw topicsError;

    const topicIds = (topics ?? [])
      .map((topic) => topic.id)
      .filter((id): id is number => Number.isFinite(id));

    let quizIds: number[] = [];

    if (topicIds.length > 0) {
      const { data: quizzes, error: quizzesError } = await supabaseAdmin
        .from("quizzes")
        .select("id")
        .in("topic_id", topicIds);

      if (quizzesError) throw quizzesError;

      quizIds = (quizzes ?? [])
        .map((quiz) => quiz.id)
        .filter((id): id is number => Number.isFinite(id));
    }

    if (quizIds.length > 0) {
      const [{ error: attemptsError }, { error: questionsError }] =
        await Promise.all([
          supabaseAdmin.from("quiz_attempts").delete().in("quiz_id", quizIds),
          supabaseAdmin.from("quiz_questions").delete().in("quiz_id", quizIds),
        ]);

      if (attemptsError) throw attemptsError;
      if (questionsError) throw questionsError;
    }

    if (quizIds.length > 0) {
      const { error: quizzesError } = await supabaseAdmin
        .from("quizzes")
        .delete()
        .in("id", quizIds);

      if (quizzesError) throw quizzesError;
    }

    if (topicIds.length > 0) {
      const { error: topicsDeleteError } = await supabaseAdmin
        .from("topics")
        .delete()
        .in("id", topicIds);

      if (topicsDeleteError) throw topicsDeleteError;
    }

    const { error: moduleError } = await supabaseAdmin
      .from("modules")
      .delete()
      .eq("id", moduleId);

    if (moduleError) throw moduleError;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
