// app/api/admin/topics/[topicId]/sync-quiz/route.ts
// POST /api/admin/topics/[topicId]/sync-quiz
//
// On-demand quiz sync for topics that have lesson_content stored in the DB.
// Reads the topic's lesson_content JSONB, extracts quiz.questions,
// and syncs quiz_questions rows via the ingestion service.
//
// Use cases:
//   1. After seeding engine topics (lesson_content = null at seed time —
//      teacher later uploads content and triggers sync)
//   2. After re-importing CSV to refresh quiz questions without re-uploading the file
//   3. For manually authored topics where lesson_content was set via the editor
//
// If lesson_content is null: attempts to fetch from the live engine proxy
// (/api/lesson-content/:engineTopicId) and uses that JSON.
//
// Returns: { ok, quizId, questionsWritten, skippedQuestions, message }

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../lib/auth';
import { ingestLessonContent } from '../../../../../../lib/ingestLesson';
import type { LessonContract } from '../../../../../../lib/lessonContract';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;
    const supabase = auth.adminClient;

    const { topicId: topicIdParam } = await params;
    const topicId = Number(topicIdParam);
    if (!Number.isFinite(topicId)) {
      return NextResponse.json({ error: 'Invalid topicId' }, { status: 400 });
    }

    // 1. Load the topic row
    const { data: topic, error: topicErr } = await supabase
      .from('topics')
      .select('id, module_id, title, order_index, description, engine_topic_id, lesson_content, status')
      .eq('id', topicId)
      .single();

    if (topicErr || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    let lessonJson: LessonContract | null = topic.lesson_content as LessonContract | null;

    // 2. If lesson_content is null and topic has engine_topic_id, try fetching from engine
    if (!lessonJson && topic.engine_topic_id) {
      const engineTopicId = topic.engine_topic_id as string;

      // Build internal URL: call our own /api/lesson-content/:engineTopicId
      // Use absolute URL for server-side fetch within Next.js
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';

      try {
        const fetchUrl = `${baseUrl}/api/lesson-content/${encodeURIComponent(engineTopicId)}`;
        const engineRes = await fetch(fetchUrl, {
          headers: { 'x-internal-sync': '1' },
        });

        if (engineRes.ok) {
          lessonJson = (await engineRes.json()) as LessonContract;
        } else {
          return NextResponse.json(
            {
              error: `Engine lesson JSON not available for "${engineTopicId}" (status ${engineRes.status}). ` +
                'Upload the CSV for this topic first, or ensure the engine is reachable.',
            },
            { status: 422 },
          );
        }
      } catch (fetchErr) {
        return NextResponse.json(
          {
            error: 'Could not reach lesson engine to fetch lesson JSON.',
            details: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
          },
          { status: 502 },
        );
      }
    }

    if (!lessonJson) {
      return NextResponse.json(
        {
          error: 'No lesson_content found for this topic and no engine_topic_id to fetch from. ' +
            'Import the lesson via CSV first.',
        },
        { status: 422 },
      );
    }

    // 3. Delegate to ingestLessonContent — syncs quiz + quiz_questions
    const source = topic.engine_topic_id
      ? 'engine' as const
      : 'manual' as const;

    const outcome = await ingestLessonContent({
      supabaseAdmin: supabase,
      moduleId: topic.module_id as number,
      lessonId: (topic.engine_topic_id as string) || `manual-${topicId}`,
      topicNumber: topic.order_index as number,
      title: topic.title as string,
      description: (topic.description as string) || '',
      status: (topic.status as 'draft' | 'published') || 'draft',
      source,
      lessonJson,
    });

    if (!outcome.ok) {
      return NextResponse.json(
        { error: outcome.error.message, step: outcome.error.step, details: outcome.error.details },
        { status: 500 },
      );
    }

    const { quizId, questionsWritten, skippedQuestions, quizAction } = outcome.result;

    return NextResponse.json({
      ok: true,
      topicId,
      quizId,
      quizAction,
      questionsWritten,
      skippedQuestions,
      message: `Quiz synced: ${questionsWritten} pertanyaan tersimpan${skippedQuestions > 0 ? `, ${skippedQuestions} dilewati` : ''}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
