import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
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
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description = typeof body?.description === "string" ? body.description : "";
    const level = typeof body?.level === "string" ? body.level : "beginner";

    if (!name) {
      return NextResponse.json(
        { error: "Nama modul wajib diisi." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
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
  } catch (error) {
    return NextResponse.json(
      { error: "Permintaan tidak valid." },
      { status: 400 },
    );
  }
}
