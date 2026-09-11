// POST /api/admin/modules/[id]/seed-engine-topics
// Auto-creates topics from built-in engine lessons for a module.
// Body: { category: 'HTML' | 'CSS' | 'JavaScript' | 'Scratch' }
// - Reads BUILT_IN_LESSONS filtered by category
// - For each lesson: inserts a topic if no topic with that engine_topic_id exists already
// - Sets status = 'published' so students can see them immediately
// - Returns { created: number, skipped: number, topics: [...] }

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/auth";
import { BUILT_IN_LESSONS } from "../../../../../../lib/builtInLessons";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;
    const supabase = auth.adminClient;
    const { id: moduleId } = await params;

    const body = await request.json();
    const { category } = body as { category?: string };

    if (!category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const moduleIdNum = Number(moduleId);
    if (!Number.isFinite(moduleIdNum)) {
      return NextResponse.json({ error: "Invalid module ID" }, { status: 400 });
    }

    // Filter lessons by category
    const lessons = BUILT_IN_LESSONS.filter((l) => l.category === category);
    if (lessons.length === 0) {
      return NextResponse.json(
        { error: `No lessons found for category: ${category}` },
        { status: 400 }
      );
    }

    // Fetch existing topics for this module to avoid duplicates
    const { data: existingTopics } = await supabase
      .from("topics")
      .select("engine_topic_id, order_index")
      .eq("module_id", moduleIdNum);

    const existingEngineIds = new Set(
      (existingTopics ?? [])
        .map((t: { engine_topic_id: string | null }) => t.engine_topic_id)
        .filter(Boolean)
    );
    const maxOrderIndex = (existingTopics ?? []).reduce(
      (max: number, t: { order_index: number | null }) =>
        Math.max(max, t.order_index ?? 0),
      0
    );

    let created = 0;
    let skipped = 0;
    const createdTopics: string[] = [];

    for (const lesson of lessons) {
      if (existingEngineIds.has(lesson.id)) {
        skipped++;
        continue;
      }

      const orderIndex = maxOrderIndex + created + 1;
      const { error } = await supabase.from("topics").insert({
        module_id: moduleIdNum,
        title: lesson.title,
        order_index: orderIndex,
        engine_topic_id: lesson.id,
        status: "published",
        published_at: new Date().toISOString(),
        description: null,
        project_link: null,
        lesson_content: null,
      });

      if (!error) {
        created++;
        createdTopics.push(`${lesson.id} — ${lesson.title}`);
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      skipped,
      topics: createdTopics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
