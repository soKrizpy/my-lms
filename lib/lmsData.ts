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
