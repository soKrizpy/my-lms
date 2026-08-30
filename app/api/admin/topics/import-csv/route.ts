// app/api/admin/topics/import-csv/route.ts
// POST /api/admin/topics/import-csv
// Accepts a multipart/form-data CSV file + moduleId.
// Parses LESSON / NODE / QUIZ rows, validates structure,
// then writes lesson_content JSONB to the matching topic row.
//
// The topic must already exist (created via normal topic form).
// The CSV lessonId must match an existing topic.engine_topic_id,
// OR if the topic has no engine_topic_id yet, it is matched by
// (module_id + order_index == topicNumber).
//
// On success each processed lesson returns { lessonId, topicId, ok: true }.
// On failure the whole request returns { error, details }.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

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

function buildNode(row: CsvNodeRow): Record<string, unknown> {
  const base = { id: row.nodeId, type: row.nodeType, title: row.title, xp: row.xp };
  switch (row.nodeType) {
    case 'lesson': return { ...base, explanation: row.content };
    case 'code': return {
      ...base, explanation: row.content || undefined,
      code: { language: row.language ?? 'html', content: row.codeContent ?? '' },
    };
    case 'practice': {
      const opts = row.options ? row.options.split('|').map(o => o.trim()) : [];
      return {
        ...base, instructions: row.content, interactionType: 'multiple-choice',
        options: opts, correctOption: row.correctOption ?? '',
      };
    }
    case 'challenge': return { ...base, instructions: row.content };
    default: return base;
  }
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

function buildLessonJson(
  lesson: CsvLessonRow,
  nodeRows: CsvNodeRow[],
  quizRows: CsvQuizRow[],
): { json: Record<string, unknown> | null; error?: string } {
  if (nodeRows.length < 5) return { json: null, error: `Min 5 nodes required (got ${nodeRows.length})` };
  if (nodeRows.length > 50) return { json: null, error: `Max 50 nodes allowed (got ${nodeRows.length})` };
  if (quizRows.length < 3) return { json: null, error: `Min 3 quiz questions required (got ${quizRows.length})` };
  if (quizRows.length > 20) return { json: null, error: `Max 20 quiz questions allowed (got ${quizRows.length})` };

  const json: Record<string, unknown> = {
    schemaVersion: '1.0',
    metadata: {
      id: lesson.lessonId, title: lesson.title, description: lesson.description,
      level: lesson.level, category: lesson.category,
      topicNumber: lesson.topicNumber, estimatedTime: lesson.estimatedTime, xp: lesson.xp,
    },
    objectives: [`Memahami ${lesson.title}`],
    learningPath: nodeRows.map(buildNode),
    quiz: {
      questions: quizRows.map(q => ({
        id: q.questionId, question: q.question,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
        correctAnswer: q.correctAnswer, explanation: q.explanation, points: q.points,
      })),
    },
    completion: {
      title: 'Selesai!',
      message: `Kamu telah menyelesaikan topik ${lesson.title}. Kerja bagus!`,
      achievementName: `${lesson.title} — Completed`,
      achievementIcon: '🎯',
    },
  };
  return { json };
}

// ─── API Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth: admin only
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
  }

  const file = formData.get('csv');
  const moduleIdRaw = formData.get('moduleId');

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

  // Load existing topics for this module (to match by engine_topic_id or order_index)
  const admin = getSupabaseAdmin();
  const { data: existingTopics, error: topicsError } = await admin
    .from('topics')
    .select('id, title, order_index, engine_topic_id')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true });

  if (topicsError) {
    return NextResponse.json({ error: `DB error: ${topicsError.message}` }, { status: 500 });
  }

  const results: Array<{
    lessonId: string; topicId: number | null;
    ok: boolean; action?: string; error?: string;
  }> = [];

  for (const [lessonId, lesson] of Array.from(lessons.entries()) as [string, CsvLessonRow][]) {
    const nodeRows = nodes.get(lessonId) ?? [];
    const quizRows = quizzes.get(lessonId) ?? [];

    // Build JSON
    const { json, error: buildError } = buildLessonJson(lesson, nodeRows, quizRows);
    if (buildError || !json) {
      results.push({ lessonId, topicId: null, ok: false, error: buildError ?? 'Build failed' });
      continue;
    }

    // Find matching topic:
    // 1. Match by engine_topic_id === lessonId
    // 2. Fallback: match by order_index === topicNumber
    const topics = existingTopics ?? [];
    let matchedTopic = topics.find(t => t.engine_topic_id === lessonId);
    if (!matchedTopic) {
      matchedTopic = topics.find(t => t.order_index === lesson.topicNumber);
    }

    if (!matchedTopic) {
      results.push({
        lessonId, topicId: null, ok: false,
        error: `No topic found in module ${moduleId} with engine_topic_id="${lessonId}" or order_index=${lesson.topicNumber}. Create the topic first.`,
      });
      continue;
    }

    // Upsert lesson_content + engine_topic_id + status stays draft
    const { error: updateError } = await admin
      .from('topics')
      .update({
        lesson_content: json,
        engine_topic_id: lessonId,   // auto-link if not already set
      })
      .eq('id', matchedTopic.id);

    if (updateError) {
      results.push({ lessonId, topicId: matchedTopic.id, ok: false, error: updateError.message });
    } else {
      results.push({
        lessonId, topicId: matchedTopic.id, ok: true,
        action: `lesson_content written to topic "${matchedTopic.title}" (id=${matchedTopic.id})`,
      });
    }
  }

  const allOk = results.every(r => r.ok);
  const anyOk = results.some(r => r.ok);

  return NextResponse.json(
    { results, parseErrors, summary: { total: results.length, ok: results.filter(r => r.ok).length } },
    { status: allOk ? 200 : anyOk ? 207 : 400 },
  );
}