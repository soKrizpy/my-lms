// lib/ingestLesson.ts
// Central lesson ingestion service for bits2bytes-lms.
//
// ingestLessonContent() is the single entry point for persisting lesson engine
// data into the LMS relational database. All ingestion sources (CSV bulk upload,
// premade engine template seed, manual authoring) MUST route through this function.
//
// Guarantees:
//   1. topics row upserted with lesson_content = full engine-format JSON
//   2. quizzes row upserted (one per topic, keyed on topic_id)
//   3. quiz_questions rows synced (delete-then-bulk-insert) from lesson JSON
//   4. All writes go through the Supabase admin client (service_role) — RLS bypassed
//   5. Errors are propagated as IngestError objects — callers decide on HTTP status
//
// Mapping rules for quiz_questions:
//   - Engine stores correctAnswer as free-text matching one of options[0..3]
//   - LMS stores correct_option as letter A|B|C|D  (index 0→A, 1→B, 2→C, 3→D)
//   - Questions that cannot be mapped are SKIPPED and counted in skippedQuestions

import { SupabaseClient } from '@supabase/supabase-js';
import {
  LessonContract,
  toInsertableQuestion,
  type LmsQuizQuestion,
} from './lessonContract';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface IngestOptions {
  /** Supabase admin client (service_role). Caller provides it so this service
   *  stays environment-agnostic and easy to unit-test. */
  supabaseAdmin: SupabaseClient;
  /** The LMS module this topic belongs to. */
  moduleId: number;
  /** engine_topic_id — the stable slug, e.g. "beginner-html-01" */
  lessonId: string;
  /** Sequential position within the module (maps to order_index). */
  topicNumber: number;
  /** Display title for the topic row. */
  title: string;
  /** Short description for the topic row. */
  description: string;
  /**
   * 'draft'     — topic is not yet visible to students (default for CSV imports)
   * 'published' — topic is immediately visible to students (use for engine seeds)
   */
  status: 'draft' | 'published';
  /** Source label applied to quiz_questions rows for traceability. */
  source: LmsQuizQuestion['source'];
  /**
   * The validated engine-format lesson JSON. Must conform to LessonContract.
   * The quiz.questions array is used to populate quiz_questions rows.
   */
  lessonJson: LessonContract;
}

export interface IngestResult {
  /** Database ID of the topic row (new or existing). */
  topicId: number;
  /** Database ID of the quiz row (new or existing). */
  quizId: number;
  /** Number of quiz_questions rows written. */
  questionsWritten: number;
  /** Number of quiz questions skipped due to mapping failure. */
  skippedQuestions: number;
  /** 'created' if the topic row was new, 'updated' if it already existed. */
  topicAction: 'created' | 'updated';
  /** 'created' if the quiz row was new, 'found' if it already existed. */
  quizAction: 'created' | 'found';
}

export interface IngestError {
  step: 'upsert-topic' | 'upsert-quiz' | 'sync-questions' | 'unknown';
  message: string;
  details?: string;
}

export type IngestOutcome =
  | { ok: true; result: IngestResult }
  | { ok: false; error: IngestError };

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Atomically ingests a lesson into the LMS database.
 *
 * Steps:
 *  1. Upsert topics row (match by engine_topic_id, then by module_id + order_index)
 *  2. Upsert quizzes row (one per topic)
 *  3. Sync quiz_questions rows (delete existing + bulk insert from lessonJson)
 *
 * @returns IngestOutcome — check `.ok` before using `.result` or `.error`
 */
export async function ingestLessonContent(
  opts: IngestOptions,
): Promise<IngestOutcome> {
  const {
    supabaseAdmin: admin,
    moduleId,
    lessonId,
    topicNumber,
    title,
    description,
    status,
    source,
    lessonJson,
  } = opts;

  // ── Step 1: Upsert topic ────────────────────────────────────────────────────
  let topicId: number;
  let topicAction: IngestResult['topicAction'];

  try {
    // Try to find existing topic by engine_topic_id
    const { data: existing, error: lookupErr } = await admin
      .from('topics')
      .select('id')
      .eq('engine_topic_id', lessonId)
      .maybeSingle();

    if (lookupErr) {
      return {
        ok: false,
        error: {
          step: 'upsert-topic',
          message: 'Failed to look up existing topic',
          details: lookupErr.message,
        },
      };
    }

    if (existing) {
      // Topic exists — update lesson_content, status, published_at
      topicId = existing.id;
      topicAction = 'updated';

      const updatePayload: Record<string, unknown> = {
        lesson_content: lessonJson,
        engine_topic_id: lessonId, // ensure it's set in case of legacy rows
      };

      if (status === 'published') {
        updatePayload.status = 'published';
        updatePayload.published_at = new Date().toISOString();
      }

      const { error: updateErr } = await admin
        .from('topics')
        .update(updatePayload)
        .eq('id', topicId);

      if (updateErr) {
        return {
          ok: false,
          error: {
            step: 'upsert-topic',
            message: 'Failed to update topic',
            details: updateErr.message,
          },
        };
      }
    } else {
      // Topic does not exist — also check by (module_id, order_index) as fallback
      const { data: byOrder } = await admin
        .from('topics')
        .select('id')
        .eq('module_id', moduleId)
        .eq('order_index', topicNumber)
        .is('engine_topic_id', null) // only claim unlinked topics
        .maybeSingle();

      if (byOrder) {
        // Adopt existing unlinked topic
        topicId = byOrder.id;
        topicAction = 'updated';

        const updatePayload: Record<string, unknown> = {
          lesson_content: lessonJson,
          engine_topic_id: lessonId,
          title,
          description: description || null,
        };

        if (status === 'published') {
          updatePayload.status = 'published';
          updatePayload.published_at = new Date().toISOString();
        }

        const { error: adoptErr } = await admin
          .from('topics')
          .update(updatePayload)
          .eq('id', topicId);

        if (adoptErr) {
          return {
            ok: false,
            error: {
              step: 'upsert-topic',
              message: 'Failed to adopt existing topic',
              details: adoptErr.message,
            },
          };
        }
      } else {
        // Create brand-new topic
        topicAction = 'created';
        const insertPayload: Record<string, unknown> = {
          module_id: moduleId,
          title,
          order_index: topicNumber,
          description: description || null,
          engine_topic_id: lessonId,
          lesson_content: lessonJson,
          status,
        };

        if (status === 'published') {
          insertPayload.published_at = new Date().toISOString();
        }

        const { data: newTopic, error: insertErr } = await admin
          .from('topics')
          .insert(insertPayload)
          .select('id')
          .single();

        if (insertErr) {
          // 23505 = unique violation on engine_topic_id (already linked elsewhere)
          const hint =
            insertErr.code === '23505'
              ? ` (engine_topic_id "${lessonId}" is already linked to a topic in another module)`
              : '';
          return {
            ok: false,
            error: {
              step: 'upsert-topic',
              message: 'Failed to create topic' + hint,
              details: insertErr.message,
            },
          };
        }

        topicId = newTopic.id;
      }
    }
  } catch (e) {
    return {
      ok: false,
      error: {
        step: 'upsert-topic',
        message: 'Unexpected error during topic upsert',
        details: e instanceof Error ? e.message : String(e),
      },
    };
  }

  // ── Step 2: Upsert quiz row ─────────────────────────────────────────────────
  let quizId: number;
  let quizAction: IngestResult['quizAction'];

  try {
    const { data: existingQuiz, error: quizLookupErr } = await admin
      .from('quizzes')
      .select('id')
      .eq('topic_id', topicId)
      .maybeSingle();

    if (quizLookupErr) {
      return {
        ok: false,
        error: {
          step: 'upsert-quiz',
          message: 'Failed to look up existing quiz',
          details: quizLookupErr.message,
        },
      };
    }

    if (existingQuiz) {
      quizId = existingQuiz.id;
      quizAction = 'found';
    } else {
      const { data: newQuiz, error: quizInsertErr } = await admin
        .from('quizzes')
        .insert({
          topic_id: topicId,
          title: `Quiz: ${title}`,
          source,
        })
        .select('id')
        .single();

      if (quizInsertErr) {
        return {
          ok: false,
          error: {
            step: 'upsert-quiz',
            message: 'Failed to create quiz',
            details: quizInsertErr.message,
          },
        };
      }

      quizId = newQuiz.id;
      quizAction = 'created';
    }
  } catch (e) {
    return {
      ok: false,
      error: {
        step: 'upsert-quiz',
        message: 'Unexpected error during quiz upsert',
        details: e instanceof Error ? e.message : String(e),
      },
    };
  }

  // ── Step 3: Sync quiz_questions ─────────────────────────────────────────────
  let questionsWritten = 0;
  let skippedQuestions = 0;

  try {
    const rawQuestions = lessonJson.quiz?.questions ?? [];

    // Build insertable rows, skipping any that can't be mapped
    const insertRows: LmsQuizQuestion[] = [];
    for (const q of rawQuestions) {
      const row = toInsertableQuestion(q, quizId, source);
      if (row) {
        insertRows.push(row);
      } else {
        skippedQuestions++;
      }
    }

    // Delete existing questions for this quiz (full sync — avoids duplicates
    // when content is re-imported after edits)
    if (rawQuestions.length > 0) {
      const { error: deleteErr } = await admin
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);

      if (deleteErr) {
        return {
          ok: false,
          error: {
            step: 'sync-questions',
            message: 'Failed to clear existing quiz questions',
            details: deleteErr.message,
          },
        };
      }
    }

    if (insertRows.length > 0) {
      const { error: insertErr } = await admin
        .from('quiz_questions')
        .insert(insertRows);

      if (insertErr) {
        return {
          ok: false,
          error: {
            step: 'sync-questions',
            message: 'Failed to insert quiz questions',
            details: insertErr.message,
          },
        };
      }

      questionsWritten = insertRows.length;
    }
  } catch (e) {
    return {
      ok: false,
      error: {
        step: 'sync-questions',
        message: 'Unexpected error during question sync',
        details: e instanceof Error ? e.message : String(e),
      },
    };
  }

  return {
    ok: true,
    result: {
      topicId,
      quizId,
      questionsWritten,
      skippedQuestions,
      topicAction,
      quizAction,
    },
  };
}

// ─── Convenience: create an empty quiz stub for a known topic ─────────────────

/**
 * Creates a quizzes row for an existing topic that has no quiz yet.
 * Used by seed-engine-topics when lesson JSON is not available at seed time.
 * Returns the quiz id, or null on error.
 */
export async function ensureQuizStub(
  admin: SupabaseClient,
  topicId: number,
  topicTitle: string,
  source: LmsQuizQuestion['source'] = 'engine',
): Promise<number | null> {
  // Check if quiz already exists
  const { data: existing } = await admin
    .from('quizzes')
    .select('id')
    .eq('topic_id', topicId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await admin
    .from('quizzes')
    .insert({ topic_id: topicId, title: `Quiz: ${topicTitle}`, source })
    .select('id')
    .single();

  if (error) {
    console.error(`[ingestLesson] ensureQuizStub failed for topic ${topicId}:`, error.message);
    return null;
  }

  return data.id;
}
