// app/admin/modules/[id]/topics/[topicId]/quiz/page.tsx
import Link from "next/link";
import { AddQuizQuestionForm } from "./AddQuizQuestionForm";
import { QuizQuestionList } from "./QuizQuestionList";
import {
  getQuizQuestions,
  getOrCreateQuiz,
  getTopicById,
} from "../../../../../../../lib/lmsData";

type PageProps = {
  params:
    | {
        id?: string; // module id
        topicId?: string; // topic id
        [key: string]: unknown;
      }
    | Promise<{ id?: string; topicId?: string; [key: string]: unknown }>;
};

export default async function TopicQuizPage({ params }: PageProps) {
  const resolvedParams = await params;
  const moduleIdParam =
    typeof resolvedParams?.id === "string"
      ? resolvedParams.id
      : typeof params === "object" &&
          params !== null &&
          "id" in params &&
          typeof (params as { id?: unknown }).id === "string"
        ? (params as { id?: string }).id
        : undefined;
  const topicIdParam =
    typeof resolvedParams?.topicId === "string"
      ? resolvedParams.topicId
      : typeof params === "object" &&
          params !== null &&
          "topicId" in params &&
          typeof (params as { topicId?: unknown }).topicId === "string"
        ? (params as { topicId?: string }).topicId
        : undefined;

  if (!topicIdParam) {
    return (
      <section>
        <h1>Quiz Topik</h1>
        <p style={{ color: "red" }}>ID topik tidak valid.</p>
      </section>
    );
  }

  const { data: topicData, error: topicError } =
    await getTopicById(topicIdParam);
  const { data: quiz, error: quizError } = await getOrCreateQuiz(
    Number(topicIdParam),
    `Quiz untuk ${topicData?.title ?? "topik"}`,
  );

  const { data: questions, error: questionsError } = await getQuizQuestions(
    quiz?.id ?? 0,
  );

  if (topicError) {
    return (
      <section>
        <h1>Quiz Topik</h1>
        <p style={{ color: "red" }}>Error topik: {topicError.message}</p>
      </section>
    );
  }

  if (quizError) {
    return (
      <section>
        <h1>Quiz Topik</h1>
        <p style={{ color: "red" }}>Error membuat quiz: {quizError.message}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">
          Quiz untuk Topik: {topicData?.title ?? "-"}
        </h1>
        <p className="text-sm text-slate-600">Module ID: {moduleIdParam}</p>
        <Link
          href={`/admin/modules/${moduleIdParam}/topics`}
          className="text-sm font-medium text-slate-900 underline"
        >
          ← Kembali ke daftar topik
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Daftar Pertanyaan Quiz
          </h2>
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
            {questions?.length ?? 0} soal
          </span>
        </div>

        {questionsError && (
          <p className="mb-3 text-sm text-red-600">
            Error pertanyaan: {questionsError.message}
          </p>
        )}

        {!questions || questions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Belum ada pertanyaan untuk quiz ini.
          </p>
        ) : (
          <QuizQuestionList questions={questions} />
        )}
      </div>

      {quiz?.id && <AddQuizQuestionForm quizId={quiz.id} />}
    </section>
  );
}
