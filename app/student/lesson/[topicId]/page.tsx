import { redirect } from "next/navigation";
import { getTopicById, getOrCreateQuiz, getQuizQuestions } from "../../../../lib/lmsData";
import { createClient } from "../../../../lib/supabase/server";
import { LessonPlayerClient } from "./LessonPlayerClient";
import { normalizeLessonContentNodes, normalizeLessonContentQuiz } from "../../../../lib/lessonContract";

type PageProps = {
  params: { topicId: string } | Promise<{ topicId: string }>;
};

export default async function LessonPage({ params }: PageProps) {
  const resolvedParams = await params;
  const topicId = Number(resolvedParams.topicId);

  if (!topicId || isNaN(topicId)) {
    return redirect("/student");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: topic, error: topicError } = await getTopicById(topicId.toString());

  if (topicError || !topic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Topic Not Found</h1>
          <p className="text-slate-600 mb-6">Materi yang kamu cari tidak ditemukan atau belum tersedia.</p>
          <a href="/student" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors">
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Extract Mimo/Duolingo style content
  // 1. nodes from lesson_content
  // 2. quiz from lesson_content OR quiz_questions table
  
  let nodes = normalizeLessonContentNodes((topic as any).lesson_content);
  
  // If there are no nodes, create a fallback node so the UI doesn't crash
  if (!nodes || nodes.length === 0) {
    nodes = [{
      id: "fallback-node-1",
      type: "lesson",
      title: topic.title || "Lesson",
      explanation: topic.description || "Mari pelajari materi ini dengan saksama.",
    }];
  }

  // Get quiz for the topic (The Challenge at the end)
  const { data: quiz } = await getOrCreateQuiz(topic.id, `Quiz untuk ${topic.title || 'topik'}`);
  let questions: any[] = [];
  
  if (quiz?.id) {
    const { data: qData } = await getQuizQuestions(quiz.id);
    if (qData) questions = qData;
  }

  return (
    <LessonPlayerClient 
      topic={topic}
      nodes={nodes}
      questions={questions}
      quizId={quiz?.id}
      studentId={user.id}
    />
  );
}
