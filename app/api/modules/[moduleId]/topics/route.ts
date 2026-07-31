import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan.") {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  const { moduleId } = await params;

  if (!moduleId) {
    return NextResponse.json(
      { error: "ID modul tidak valid." },
      { status: 400 },
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("topics")
    .select("id, title, module_id, order_index, description, project_link")
    .eq("module_id", Number(moduleId))
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((topic) => ({
      id: topic.id,
      title: topic.title,
      module_id: topic.module_id,
      order_index: topic.order_index,
      description: topic.description,
      project_link: topic.project_link,
    })),
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    const { moduleId } = await params;
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description =
      typeof body?.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
    const projectLink =
      typeof body?.projectLink === "string" && body.projectLink.trim()
        ? body.projectLink.trim()
        : null;
    const orderIndex = Number(body?.orderIndex);

    if (!moduleId || !title || !Number.isFinite(orderIndex)) {
      return NextResponse.json(
        { error: "ID modul, judul, dan urutan topik wajib diisi." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("topics")
      .insert({
        module_id: Number(moduleId),
        title,
        order_index: orderIndex,
        description,
        project_link: projectLink,
      })
      .select("id, title, module_id, order_index, description, project_link")
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Permintaan tidak valid.") },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    const { moduleId } = await params;
    const body = await request.json();
    const id = Number(body?.id);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description =
      typeof body?.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
    const projectLink =
      typeof body?.projectLink === "string" && body.projectLink.trim()
        ? body.projectLink.trim()
        : null;
    const orderIndex = Number(body?.orderIndex);
    
    if (!moduleId || !id || !title || !Number.isFinite(orderIndex)) {
      return NextResponse.json(
        { error: "ID, judul, dan urutan topik wajib diisi." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("topics")
      .update({
        title,
        order_index: orderIndex,
        description,
        project_link: projectLink,
      })
      .eq("id", id)
      .eq("module_id", Number(moduleId))
      .select("id, title, module_id, order_index, description, project_link")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Topik tidak ditemukan atau tidak ada yang berubah." },
        { status: 404 },
      );
    }
    
    return NextResponse.json({ success: true, topic: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("topics")
      .delete()
      .eq("id", Number(id));
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
