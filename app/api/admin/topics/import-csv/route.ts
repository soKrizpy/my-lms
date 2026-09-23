// app/api/admin/topics/import-csv/route.ts
// POST /api/admin/topics/import-csv
// Accepts a multipart/form-data CSV file + moduleId.
//
// Parses LESSON / NODE / QUIZ rows from the CSV, builds a LessonContract
// per lesson, then delegates all DB writes to ingestLessonContent() — which
// atomically upserts the topics, quizzes, and quiz_questions rows.
//
// Previously this route wrote only lesson_content JSONB to topics and never
// created quizzes or quiz_questions, causing the student quiz modal to break.
// The adapter now guarantees all three tables are always in sync.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/auth';
import { ingestLessonContent } from '../../../../../lib/ingestLesson';
import type { LessonContract, LearningNode, EngineQuizQuestion } from '../../../../../lib/lessonContract';

// ─── CSV parser (ported from lesson-engine/src/engine/csvImport.ts) ───────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQ = true; }
      else if (ch === ',') { fields.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
  }
  fields.push(cur.trim());
  return fields;
}

type CsvLessonRow = {
  type: 'LESSON'; lessonId: string; title: string; description: string;
  level: 'beginner' | 'intermediate' | 'advanced'; category: string;
  topicNumber: number; estimatedTime: number; xp: number;
};
type CsvNodeRow = {
  type: 'NODE'; lessonId: string; nodeId: string;
  nodeType: 'lesson' | 'code' | 'practice' | 'challenge' | 'quiz';
  title: string; xp: number; content: string;
  language?: string; codeContent?: string;
  options?: string; correctOption?: string;
};
type CsvQuizRow = {
  type: 'QUIZ'; lessonId: string; questionId: string; question: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  correctAnswer: string; explanation: string; points: number;
};
type CsvRow = CsvLessonRow | CsvNodeRow | CsvQuizRow;

function parseRow(cols: string[]): CsvRow | null {
  const t = cols[0]?.toUpperCase();
  if (t === 'LESSON' && cols.length >= 9) {
    return {
      type: 'LESSON', lessonId: cols[1] ?? '', title: cols[2] ?? '',
      description: cols[3] ?? '',
      level: (cols[4] ?? 'beginner') as CsvLessonRow['level'],
      category: cols[5] ?? '',
      topicNumber: parseInt(cols[6] ?? '1', 10),
      estimatedTime: parseInt(cols[7] ?? '30', 10),
      xp: parseInt(cols[8] ?? '100', 10),
    };
  }
  if (t === 'NODE' && cols.length >= 7) {
    const row: CsvNodeRow = {
      type: 'NODE', lessonId: cols[1] ?? '', nodeId: cols[2] ?? '',
      nodeType: (cols[3] ?? 'lesson') as CsvNodeRow['nodeType'],
      title: cols[4] ?? '', xp: parseInt(cols[5] ?? '0', 10),
      content: cols[6] ?? '',
    };
    if (cols[7]) row.language = cols[7];
    if (cols[8]) row.codeContent = cols[8];
    if (cols[11]) row.options = cols[11];
    if (cols[12]) row.correctOption = cols[12];
    return row;
  }
  if (t === 'QUIZ' && cols.length >= 11) {
    return {
      type: 'QUIZ', lessonId: cols[1] ?? '', questionId: cols[2] ?? '',
      question: cols[3] ?? '', optionA: cols[4] ?? '', optionB: cols[5] ?? '',
      optionC: cols[6] ?? '', optionD: cols[7] ?? '',
      correctAnswer: cols[8] ?? '', explanation: cols[9] ?? '',
      points: parseInt(cols[10] ?? '20', 10),
    };
  }
  return null;
}

function parseCsv(text: string): {
  lessons: Map<string, CsvLessonRow>;
  nodes: Map<string, CsvNodeRow[]>;
  quizzes: Map<string, CsvQuizRow[]>;
  parseErrors: string[];
} {
  const lessons = new Map<string, CsvLessonRow>();
  const nodes = new Map<string, CsvNodeRow[]>();
  const quizzes = new Map<string, CsvQuizRow[]>();
  const parseErrors: string[] = [];

  const lines = text.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const row = parseRow(parseCsvLine(t));
    if (!row) { parseErrors.push(`Unrecognised row: ${t.substring(0, 60)}`); continue; }
    if (row.type === 'LESSON') {
      lessons.set(row.lessonId, row);
    } else if (row.type === 'NODE') {
      const a = nodes.get(row.lessonId) ?? [];
      a.push(row);
      nodes.set(row.lessonId, a);
    } else {
      const a = quizzes.get(row.lessonId) ?? [];
      a.push(row);
      quizzes.set(row.lessonId, a);
    }
  }
  return { lessons, nodes, quizzes, parseErrors };
}

// ─── CSV → LessonContract builder ─────────────────────────────────────────────

function buildLearningNode(row: CsvNodeRow): LearningNode {
  const base: LearningNode = {
    id: row.nodeId,
    type: row.nodeType,
    title: row.title,
    xp: row.xp || undefined,
  };
  switch (row.nodeType) {
    case 'lesson':
      return { ...base, explanation: row.content };
    case 'code':
      return {
        ...base,
        explanation: row.content || undefined,
        code: { language: row.language ?? 'html', content: row.codeContent ?? '' },
      };
    case 'practice': {
      const opts = row.options ? row.options.split('|').map((o) => o.trim()) : [];
      return {
        ...base,
        instructions: row.content,
        interactionType: 'multiple-choice',
        options: opts,
        correctOption: row.correctOption ?? '',
      };
    }
    case 'challenge':
      return { ...base, instructions: row.content };
    default:
      return base;
  }
}

function buildLessonContract(
  lesson: CsvLessonRow,
  nodeRows: CsvNodeRow[],
  quizRows: CsvQuizRow[],
  engineStyle: string,
): { contract: LessonContract | null; error?: string } {
  if (nodeRows.length < 5) return { contract: null, error: `Min 5 nodes required (got ${nodeRows.length})` };
  if (nodeRows.length > 50) return { contract: null, error: `Max 50 nodes allowed (got ${nodeRows.length})` };
  if (quizRows.length < 3) return { contract: null, error: `Min 3 quiz questions required (got ${quizRows.length})` };
  if (quizRows.length > 20) return { contract: null, error: `Max 20 quiz questions allowed (got ${quizRows.length})` };

  const learningPath: LearningNode[] = nodeRows.map(buildLearningNode);

  const questions: EngineQuizQuestion[] = quizRows.map((q) => ({
    id: q.questionId,
    type: 'multiple-choice' as const,
    question: q.question,
    options: [q.optionA, q.optionB, q.optionC, q.optionD] as [string, string, string, string],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    points: q.points,
  }));

  const contract: LessonContract = {
    schemaVersion: '1.0',
    metadata: {
      id: lesson.lessonId,
      title: lesson.title,
      description: lesson.description,
      level: lesson.level,
      category: lesson.category,
      topicNumber: lesson.topicNumber,
      estimatedTime: lesson.estimatedTime,
      xp: lesson.xp,
      engineStyle: (engineStyle || 'mimo') as LessonContract['metadata']['engineStyle'],
    },
    objectives: [`Memahami ${lesson.title}`],
    learningPath,
    quiz: { questions },
    completion: {
      title: 'Selesai!',
      message: `Kamu telah menyelesaikan topik ${lesson.title}. Kerja bagus!`,
      achievementName: `${lesson.title} — Completed`,
      achievementIcon: '🎯',
    },
  };

  return { contract };
}

// ─── API Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth + role guard
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;
  const supabaseAdmin = auth.adminClient;

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
  }

  const file = formData.get('csv');
  const moduleIdRaw = formData.get('moduleId');
  const engineStyleRaw = formData.get('engineStyle');
  const engineStyle = (typeof engineStyleRaw === 'string') ? engineStyleRaw : 'mimo';

  if (!file || typeof file === 'string' || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No CSV file provided (field name: csv)' }, { status: 400 });
  }
  if (!moduleIdRaw || typeof moduleIdRaw !== 'string') {
    return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
  }

  const moduleId = Number(moduleIdRaw);
  if (!Number.isFinite(moduleId)) {
    return NextResponse.json({ error: 'moduleId must be a number' }, { status: 400 });
  }

  // Read CSV text
  let csvText: string;
  try {
    csvText = await file.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read CSV file' }, { status: 400 });
  }

  // Parse CSV
  const { lessons, nodes, quizzes, parseErrors } = parseCsv(csvText);

  if (lessons.size === 0) {
    return NextResponse.json({
      error: 'No LESSON rows found in CSV',
      parseErrors,
      hint: 'Each topic needs a LESSON row. See the CSV template for format.',
    }, { status: 400 });
  }

  const results: Array<{
    lessonId: string;
    topicId: number | null;
    quizId: number | null;
    questionsWritten: number;
    skippedQuestions: number;
    ok: boolean;
    action?: string;
    error?: string;
  }> = [];

  for (const [lessonId, lesson] of Array.from(lessons.entries()) as [string, CsvLessonRow][]) {
    const nodeRows = nodes.get(lessonId) ?? [];
    const quizRows = quizzes.get(lessonId) ?? [];

    // Build LessonContract
    const { contract, error: buildError } = buildLessonContract(lesson, nodeRows, quizRows, engineStyle);
    if (buildError || !contract) {
      results.push({ lessonId, topicId: null, quizId: null, questionsWritten: 0, skippedQuestions: 0, ok: false, error: buildError ?? 'Build failed' });
      continue;
    }

    // Delegate all DB writes to the ingestion service
    const outcome = await ingestLessonContent({
      supabaseAdmin,
      moduleId,
      lessonId,
      topicNumber: lesson.topicNumber,
      title: lesson.title,
      description: lesson.description,
      status: 'draft', // CSV imports stay as draft — admin publishes manually
      source: 'csv',
      lessonJson: contract,
    });

    if (!outcome.ok) {
      results.push({
        lessonId, topicId: null, quizId: null, questionsWritten: 0, skippedQuestions: 0,
        ok: false,
        error: `[${outcome.error.step}] ${outcome.error.message}${outcome.error.details ? ': ' + outcome.error.details : ''}`,
      });
    } else {
      const { topicId, quizId, questionsWritten, skippedQuestions, topicAction, quizAction } = outcome.result;
      const actionMsg = topicAction === 'created'
        ? `Topik baru dibuat (draft): "${lesson.title}" (id=${topicId})`
        : `lesson_content diperbarui di topik "${lesson.title}" (id=${topicId})`;
      results.push({
        lessonId, topicId, quizId, questionsWritten, skippedQuestions, ok: true,
        action: `${actionMsg} — quiz ${quizAction} (id=${quizId}), ${questionsWritten} pertanyaan tersimpan${skippedQuestions > 0 ? `, ${skippedQuestions} dilewati` : ''}`,
      });
    }
  }

  const allOk = results.every((r) => r.ok);
  const anyOk = results.some((r) => r.ok);

  return NextResponse.json(
    { results, parseErrors, summary: { total: results.length, ok: results.filter((r) => r.ok).length } },
    { status: allOk ? 200 : anyOk ? 207 : 400 },
  );
}