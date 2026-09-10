import { getSupabaseAdmin } from "./supabaseAdmin";

export type ModuleRecord = {
  id: number;
  title: string | null;
  description: string | null;
  created_at?: string | null;
  is_active?: boolean | null;
};

export type TopicRecord = {
  id: number;
  module_id: number;
  title: string;
  order_index: number;
  description?: string | null;
  project_link?: string | null;
  engine_topic_id?: string | null;
  lesson_content?: unknown | null;
  status?: string | null;
  published_at?: string | null;
  created_at?: string | null;
};

export type QuizRecord = {
  id: number;
  topic_id: number;
  title: string | null;
  created_at?: string | null;
};

export type QuizQuestionRecord = {
  id: number;
  quiz_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  created_at?: string | null;
};

export async function getModules() {
  const supabase = getSupabaseAdmin();
  return supabase
    .from("modules")
    .select("id, title, description, created_at, is_active")
    .order("created_at", { ascending: false });
}

export async function getModuleById(moduleId: string) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from("modules")
    .select("id, title, description")
    .eq("id", Number(moduleId))
    .maybeSingle();
}

export async function getTopicById(topicId: string) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from("topics")
    .select("id, title, module_id, description, project_link, engine_topic_id")
    .eq("id", Number(topicId))
    .maybeSingle();
}

export async function getTopicsByModuleId(moduleId: number) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from("topics")
    .select("id, title, module_id, order_index, description, project_link, engine_topic_id")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: true });
}

export async function createTopic(
  moduleId: number,
  title: string,
  orderIndex: number,
  description?: string,
  projectLink?: string,
  engineTopicId?: string,
) {
  const supabase = getSupabaseAdmin();
  return supabase.from("topics").insert({
    module_id: moduleId,
    title,
    order_index: orderIndex,
    description,
    project_link: projectLink,
    engine_topic_id: engineTopicId,
  });
}

export async function updateTopic(
  topicId: number,
  title: string,
  orderIndex: number,
  description?: string,
  projectLink?: string,
  engineTopicId?: string,
) {
  const supabase = getSupabaseAdmin();
  return supabase.from("topics").update({
    title,
    order_index: orderIndex,
    description,
    project_link: projectLink,
    engine_topic_id: engineTopicId,
  }).eq("id", topicId);
}

export async function deleteTopic(topicId: number) {
  const supabase = getSupabaseAdmin();
  return supabase.from("topics").delete().eq("id", topicId);
}

export async function getOrCreateQuiz(topicId: number, fallbackTitle: string) {
  const supabase = getSupabaseAdmin();
  const { data: existingQuiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id, topic_id, title")
    .eq("topic_id", topicId)
    .maybeSingle();

  if (existingQuiz) {
    return { data: existingQuiz, error: null };
  }

  if (quizError) {
    return { data: null, error: quizError };
  }

  return supabase
    .from("quizzes")
    .insert({
      topic_id: topicId,
      title: fallbackTitle,
    })
    .select("id, topic_id, title")
    .single();
}

export async function getQuizQuestions(quizId: number) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from("quiz_questions")
    .select(
      "id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option",
    )
    .eq("quiz_id", quizId)
    .order("id", { ascending: true });
}

export async function createQuizQuestion(input: {
  quizId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: string;
}) {
  const supabase = getSupabaseAdmin();
  return supabase.from("quiz_questions").insert({
    quiz_id: input.quizId,
    question_text: input.question,
    option_a: input.optionA,
    option_b: input.optionB,
    option_c: input.optionC,
    option_d: input.optionD,
    correct_option: input.correct,
  });
}

export async function updateQuizQuestion(
  id: number,
  input: {
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correct: string;
  }
) {
  const supabase = getSupabaseAdmin();
  return supabase.from("quiz_questions").update({
    question_text: input.question,
    option_a: input.optionA,
    option_b: input.optionB,
    option_c: input.optionC,
    option_d: input.optionD,
    correct_option: input.correct,
  }).eq("id", id);
}

export async function deleteQuizQuestion(id: number) {
  const supabase = getSupabaseAdmin();
  return supabase.from("quiz_questions").delete().eq("id", id);
}

// --- Pause Learning Path types ---

export type ModuleStatus = 'active' | 'paused';

export interface StudentModuleRow {
  student_id: string;
  module_id: number;
  status: ModuleStatus;
}

// ── Module Assessment types ──────────────────────────────────────────────────

export type AssessmentRecord = {
  id: number;
  module_id: number;
  title: string;
  created_at: string;
};

export type AssessmentQuestionRecord = {
  id: number;
  assessment_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  order_index: number;
  created_at: string;
};

// Question as returned to the student (no correct_option field)
export type AssessmentQuestionPublic = Omit<AssessmentQuestionRecord, 'correct_option' | 'created_at'>;

export type AssessmentAttemptRecord = {
  id: number;
  student_id: string;
  assessment_id: number;
  attempt_number: 1 | 2;
  score: number;          // 0–100
  best_score: number;     // 0–100, MAX of all attempts for this student+assessment
  total_questions: number;
  correct_count: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;  // { "<questionId>": "A"|"B"|"C"|"D" }
  submitted_at: string;
};

// Summary included in student dashboard response
export type AssessmentSummary = {
  assessment_id: number;
  attempt_count: number;   // 0, 1, or 2
  best_score: number;      // 0–100; 0 when attempt_count === 0
};

// Single attempt score shown on results/history screen
export type AttemptScore = {
  attempt_number: 1 | 2;
  score: number;
  submitted_at: string;
};

// Per-question result shown on the result screen after submission
export type QuestionResult = {
  question_id: number;
  question_text: string;
  selected_option: 'A' | 'B' | 'C' | 'D';
  correct_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
};

// Full result returned from POST /api/student/assessment/submit
export type AssessmentSubmitResult = {
  score: number;
  best_score: number;
  attempt_number: 1 | 2;
  total_questions: number;
  correct_count: number;
  question_results: QuestionResult[];
};

// State of an assessment from the student's perspective
export type AssessmentState =
  | { status: 'locked' }                                        // module not complete
  | { status: 'no_assessment' }                                 // module has no assessment yet
  | { status: 'available'; assessment_id: number; attempt_count: 0 | 1 }
  | { status: 'exhausted'; assessment_id: number; best_score: number; attempt_scores: AttemptScore[] };

// ── Module Assessment helpers ────────────────────────────────────────────────

export async function getAssessmentByModuleId(moduleId: number) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from("module_assessments")
    .select("id, module_id, title, created_at")
    .eq("module_id", moduleId)
    .maybeSingle();
}

export async function getAssessmentQuestions(assessmentId: number) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from("module_assessment_questions")
    .select(
      "id, assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, order_index, created_at",
    )
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: true });
}

export async function getAssessmentAttempts(studentId: string, assessmentId: number) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from("module_assessment_attempts")
    .select(
      "id, student_id, assessment_id, attempt_number, score, best_score, total_questions, correct_count, answers, submitted_at",
    )
    .eq("student_id", studentId)
    .eq("assessment_id", assessmentId)
    .order("attempt_number", { ascending: true });
}

export async function getAssessmentSummariesForStudent(
  studentId: string,
  assessmentIds: number[],
): Promise<AssessmentSummary[]> {
  if (assessmentIds.length === 0) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("module_assessment_attempts")
    .select("assessment_id, score")
    .eq("student_id", studentId)
    .in("assessment_id", assessmentIds);

  if (error) {
    console.error("getAssessmentSummariesForStudent: error fetching attempts", error);
    // Graceful degradation: return zero-attempt summaries for all ids
    return assessmentIds.map((id) => ({ assessment_id: id, attempt_count: 0, best_score: 0 }));
  }

  const rows = data ?? [];

  // Group attempts by assessment_id
  const grouped = new Map<number, number[]>();
  for (const row of rows) {
    const existing = grouped.get(row.assessment_id) ?? [];
    existing.push(row.score as number);
    grouped.set(row.assessment_id, existing);
  }

  return assessmentIds.map((id) => {
    const scores = grouped.get(id) ?? [];
    return {
      assessment_id: id,
      attempt_count: scores.length,
      best_score: scores.length > 0 ? Math.max(...scores) : 0,
    };
  });
}
