import { NextResponse } from "next/server";
import { getTopicsByModuleId, updateTopic, deleteTopic } from "../../../../../lib/lmsData";

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

  const { data, error } = await getTopicsByModuleId(Number(moduleId));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((topic) => ({
      id: topic.id,
      title: topic.title,
      order_index: topic.order_index,
    })),
  );
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    const body = await request.json();
    const { id, title, orderIndex, description, projectLink } = body;
    
    if (!id || !title) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { error } = await updateTopic(id, title, orderIndex, description, projectLink);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const { error } = await deleteTopic(Number(id));
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
