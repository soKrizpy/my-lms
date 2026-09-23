// POST /api/admin/modules/[id]/seed-engine-topics
// Auto-creates topics from built-in engine lessons for a module.
// Body: { category: 'HTML' | 'CSS' | 'JavaScript' | 'Scratch' }
//
// For each lesson in the registry that doesn't yet exist:
//   1. Inserts a published topic stub (lesson_content = null — engine serves JSON live)
//   2. Creates an empty quizzes row so topic.quiz is non-null on the student dashboard
//      (quiz_questions are populated later via /api/admin/topics/[topicId]/sync-quiz)
//
// Returns { created, skipped, topics, quizzesCreated }

import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../lib/auth';
import { BUILT_IN_LESSONS } from '../../../../../../lib/builtInLessons';
import { ensureQuizStub } from '../../../../../../lib/ingestLesson';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const supabase = auth.adminClient;
    const { id: moduleId } = await params;

    const body = await request.json();
    const { category } = body as { category?: string };

    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 });
    }

    const moduleIdNum = Number(moduleId);
    if (!Number.isFinite(moduleIdNum)) {
      return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 });
    }

    // Filter lessons by category
    const lessons = BUILT_IN_LESSONS.filter((l) => l.category === category);
    if (lessons.length === 0) {
      return NextResponse.json(
        { error: `No lessons found for category: ${category}` },
        { status: 400 },
      );
    }

    // Fetch existing topics for this module to avoid duplicates
    const { data: existingTopics } = await supabase
      .from('topics')
      .select('id, engine_topic_id, order_index')
      .eq('module_id', moduleIdNum);

    const existingEngineIds = new Set(
      (existingTopics ?? [])
        .map((t: { engine_topic_id: string | null }) => t.engine_topic_id)
        .filter(Boolean),
    );

    const maxOrderIndex = (existingTopics ?? []).reduce(
      (max: number, t: { order_index: number | null }) =>
        Math.max(max, t.order_index ?? 0),
      0,
    );

    // Map of engine_topic_id → existing topic row (for quiz stub creation on existing topics)
    const existingByEngineId = new Map(
      (existingTopics ?? [])
        .filter((t: any) => t.engine_topic_id)
        .map((t: any) => [t.engine_topic_id as string, t as { id: number; engine_topic_id: string }]),
    );

    let created = 0;
    let skipped = 0;
    let quizzesCreated = 0;
    const createdTopics: string[] = [];

    for (const lesson of lessons) {
      if (existingEngineIds.has(lesson.id)) {
        // Topic already exists — ensure it has a quiz stub (idempotent)
        const existing = existingByEngineId.get(lesson.id);
        if (existing) {
          const quizId = await ensureQuizStub(supabase, existing.id, lesson.title, 'engine');
          if (quizId !== null) {
            // quiz was newly created — we don't know if it was new, so we can't track delta
            // We only count if the function returned a value (any value means stub is ensured)
          }
        }
        skipped++;
        continue;
      }

      const orderIndex = maxOrderIndex + created + 1;
      const { data: newTopic, error } = await supabase
        .from('topics')
        .insert({
          module_id: moduleIdNum,
          title: lesson.title,
          order_index: orderIndex,
          engine_topic_id: lesson.id,
          status: 'published',
          published_at: new Date().toISOString(),
          description: null,
          project_link: null,
          lesson_content: null,
        })
        .select('id')
        .single();

      if (!error && newTopic) {
        created++;
        createdTopics.push(`${lesson.id} — ${lesson.title}`);

        // Create empty quiz stub so topic.quiz is non-null for students
        // Quiz questions are populated via /api/admin/topics/[topicId]/sync-quiz
        const quizId = await ensureQuizStub(supabase, newTopic.id, lesson.title, 'engine');
        if (quizId !== null) {
          quizzesCreated++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      skipped,
      quizzesCreated,
      topics: createdTopics,
      hint: created > 0
        ? `Run POST /api/admin/topics/[topicId]/sync-quiz to populate quiz questions from the engine JSON.`
        : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
