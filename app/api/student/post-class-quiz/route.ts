// app/api/student/post-class-quiz/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

interface PostClassOption { id: string; text: string; }
interface PostClassQuestion {
  id: string; question: string; options: PostClassOption[];
  correct_option_id: string; explanation?: string;
}
interface LessonContent {
  post_class_quiz?: PostClassQuestion[];
  cypeco_exp_reward?: number;
  [key: string]: unknown;
}
type Admin = ReturnType<typeof getSupabaseAdmin>;

async function getGlobalIndex(admin: Admin, studentId: string, moduleId: number) {
  const { data: sm } = await admin.from('student_modules').select('module_id').eq('student_id', studentId).order('module_id', { ascending: true });
  const ids = (sm ?? []).map((r: { module_id: number }) => r.module_id);
  if (!ids.length) return -1;
  const { data: topics } = await admin.from('topics').select('id, module_id, order_index').in('module_id', ids).eq('status', 'published').order('module_id', { ascending: true }).order('order_index', { ascending: true });
  return (topics ?? []).findIndex((t: { module_id: number }) => t.module_id === moduleId);
}

async function checkGate(admin: Admin, studentId: string, globalIdx: number): Promise<boolean> {
  if (globalIdx < 0) return false;
  const { data: meetings } = await admin.from('meetings').select('progress_report, meeting_students!inner(student_id)').eq('meeting_students.student_id', studentId).order('meeting_date', { ascending: true });
  const m = (meetings ?? [])[globalIdx] as { progress_report: string | null } | undefined;
  return typeof m?.progress_report === 'string' && m.progress_report.trim().length > 0;
}

async function awardCypeco(admin: Admin, studentId: string, reward: number) {
  if (reward <= 0) return;
  try {
    const { data: pet } = await admin.from('student_pets').select('id, hatch_progress, logic_data, stage').eq('student_id', studentId).maybeSingle();
    if (!pet) return;
    if ((pet.hatch_progress ?? 0) < 100) {
      const nh = Math.min(100, (pet.hatch_progress ?? 0) + reward);
      await admin.from('student_pets').update({ hatch_progress: nh, ...(nh >= 100 && pet.stage === 'EGG' ? { stage: 'READY_TO_HATCH' } : {}), updated_at: new Date().toISOString() }).eq('id', pet.id);
    } else {
      await admin.from('student_pets').update({ logic_data: (pet.logic_data ?? 0) + reward, updated_at: new Date().toISOString() }).eq('id', pet.id);
    }
  } catch { /* non-fatal */ }
}

export async function GET(req: NextRequest) {
  const sup = await createClient();
  const { data: { user } } = await sup.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const topicId = Number(req.nextUrl.searchParams.get('topicId'));
  if (!topicId) return Response.json({ error: 'topicId invalid' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: topic } = await admin.from('topics').select('id, module_id, title, lesson_content, status').eq('id', topicId).maybeSingle();
  if (!topic || (topic as any).status !== 'published') return Response.json({ error: 'Not found' }, { status: 404 });

  const gIdx = await getGlobalIndex(admin, user.id, (topic as any).module_id);
  const gated = !(await checkGate(admin, user.id, gIdx));
  if (gated) return Response.json({ gated: true, hasProgressReport: false, message: 'Menunggu laporan guru.' });

  const lc = (topic as any).lesson_content as LessonContent | null;
  const pcq = lc?.post_class_quiz;

  if (pcq?.length) {
    let attempt: { attempts_count: number; best_score: number } | null = null;
    try { const r = await admin.from('post_class_quiz_attempts').select('attempts_count, best_score').eq('student_id', user.id).eq('topic_id', topicId).maybeSingle(); attempt = r.data; } catch { /* ok */ }
    return Response.json({ gated: false, source: 'jsonb', topicId, topicTitle: (topic as any).title, cypeco_exp_reward: lc?.cypeco_exp_reward ?? 0,
      questions: pcq.map(q => ({ id: q.id, question: q.question, options: q.options, explanation: q.explanation })),
      attempt: attempt ? { attemptsCount: attempt.attempts_count, score: attempt.best_score } : { attemptsCount: 0, score: 0 } });
  }

  // Fallback System A
  const { data: quiz } = await admin.from('quizzes').select('id').eq('topic_id', topicId).maybeSingle();
  if (!quiz) return Response.json({ gated: false, source: 'none', questions: [] });
  const { data: qs } = await admin.from('quiz_questions').select('id, question_text, option_a, option_b, option_c, option_d').eq('quiz_id', (quiz as any).id).order('id', { ascending: true });
  let attemptA: { score: number; attempts_count: number } | null = null;
  try { const r = await admin.from('quiz_attempts').select('score, attempts_count').eq('student_id', user.id).eq('quiz_id', (quiz as any).id).maybeSingle(); attemptA = r.data; } catch { /* ok */ }
  return Response.json({ gated: false, source: 'relational', topicId, topicTitle: (topic as any).title, quizId: (quiz as any).id, cypeco_exp_reward: 0,
    questions: (qs ?? []).map((q: any) => ({ id: String(q.id), question: q.question_text, options: [{ id: 'A', text: q.option_a }, { id: 'B', text: q.option_b }, { id: 'C', text: q.option_c }, { id: 'D', text: q.option_d }] })),
    attempt: attemptA ? { attemptsCount: attemptA.attempts_count, score: attemptA.score } : { attemptsCount: 0, score: 0 } });
}

export async function POST(req: NextRequest) {
  const sup = await createClient();
  const { data: { user } } = await sup.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { topicId: number; source: 'jsonb' | 'relational'; quizId?: number; answers: Record<string, string> };
  const { topicId, source, quizId, answers } = body;
  if (!topicId || !answers) return Response.json({ error: 'topicId and answers required' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: topic } = await admin.from('topics').select('id, module_id, lesson_content, status').eq('id', topicId).maybeSingle();
  if (!topic || (topic as any).status !== 'published') return Response.json({ error: 'Not found' }, { status: 404 });

  const gIdx = await getGlobalIndex(admin, user.id, (topic as any).module_id);
  if (!(await checkGate(admin, user.id, gIdx))) return Response.json({ error: 'Kuis terkunci. Menunggu laporan guru.' }, { status: 403 });

  if (source === 'jsonb') {
    const lc = (topic as any).lesson_content as LessonContent | null;
    const pcq = lc?.post_class_quiz ?? [];
    if (!pcq.length) return Response.json({ error: 'No quiz' }, { status: 404 });

    let prev: { id: string; best_score: number; attempts_count: number } | null = null;
    try { const r = await admin.from('post_class_quiz_attempts').select('id, best_score, attempts_count').eq('student_id', user.id).eq('topic_id', topicId).maybeSingle(); prev = r.data; } catch { /* ok */ }
    if (prev && (prev.attempts_count ?? 0) >= 2) return Response.json({ error: 'Maks 2 percobaan.' }, { status: 400 });

    let correct = 0;
    for (const q of pcq) { if (answers[q.id] === q.correct_option_id) correct++; }
    const score = Math.round((correct / pcq.length) * 100);
    const bestScore = Math.max(prev?.best_score ?? 0, score);
    const attemptsCount = (prev?.attempts_count ?? 0) + 1;
    await admin.from('post_class_quiz_attempts').upsert({ student_id: user.id, topic_id: topicId, score: bestScore, best_score: bestScore, attempts_count: attemptsCount, last_submitted_at: new Date().toISOString() }, { onConflict: 'student_id,topic_id' });
    if (!prev) await awardCypeco(admin, user.id, lc?.cypeco_exp_reward ?? 0);
    const correctAnswers: Record<string, string> = {};
    for (const q of pcq) correctAnswers[q.id] = q.correct_option_id;
    return Response.json({ score, bestScore, total: pcq.length, correct, correctAnswers, attemptsCount, cypeco_exp_awarded: !prev ? (lc?.cypeco_exp_reward ?? 0) : 0 });
  }

  if (source === 'relational' && quizId) {
    const { data: qs } = await admin.from('quiz_questions').select('id, correct_option').eq('quiz_id', quizId);
    if (!qs?.length) return Response.json({ error: 'No questions' }, { status: 404 });
    let prev: { id: string; score: number; attempts_count: number } | null = null;
    try { const r = await admin.from('quiz_attempts').select('id, score, attempts_count').eq('student_id', user.id).eq('quiz_id', quizId).maybeSingle(); prev = r.data; } catch { /* ok */ }
    if (prev && (prev.attempts_count ?? 0) >= 2) return Response.json({ error: 'Maks 2 percobaan.' }, { status: 400 });
    let correct = 0;
    for (const q of qs as Array<{ id: number; correct_option: string }>) { if (answers[String(q.id)] === q.correct_option) correct++; }
    const score = Math.round((correct / qs.length) * 100);
    const bestScore = Math.max(prev?.score ?? 0, score);
    const attemptsCount = (prev?.attempts_count ?? 0) + 1;
    await admin.from('quiz_attempts').upsert({ student_id: user.id, quiz_id: quizId, score: bestScore, total_questions: qs.length, attempts_count: attemptsCount, engine_sourced: false }, { onConflict: 'student_id,quiz_id' });
    const correctAnswers: Record<string, string> = {};
    for (const q of qs as Array<{ id: number; correct_option: string }>) correctAnswers[String(q.id)] = q.correct_option;
    return Response.json({ score, bestScore, total: qs.length, correct, correctAnswers, attemptsCount, cypeco_exp_awarded: 0 });
  }

  return Response.json({ error: 'Invalid source' }, { status: 400 });
}
