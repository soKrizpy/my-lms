import { NextResponse } from "next/server";
import { getTopicsByModuleId } from "../../../../../lib/lmsData";

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
