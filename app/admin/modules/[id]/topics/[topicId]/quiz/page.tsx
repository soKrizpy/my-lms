// app/admin/modules/[id]/topics/[topicId]/quiz/page.tsx
import Link from "next/link";
import { AddQuizQuestionForm } from "./AddQuizQuestionForm";
import {
  getQuizQuestions,
  getOrCreateQuiz,
  getTopicById,
} from "../../../../../../../lib/lmsData";

type PageProps = {
  params: Promise<{
    id: string; // module id
    topicId: string; // topic id
  }>;
};

export default async function TopicQuizPage(props: PageProps) {
  const params = await props.params;
  const moduleIdParam = params.id;
  const topicIdParam = params.topicId;

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
          <ol className="space-y-3">
            {questions.map((question: any, idx: number) => (
              <li
                key={question.id}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <strong className="text-sm text-slate-900">
                  {idx + 1}. {question.question_text}
                </strong>
                <ul className="mt-2 ml-4 space-y-1 text-sm text-slate-700">
                  <li>A. {question.option_a}</li>
                  <li>B. {question.option_b}</li>
                  <li>C. {question.option_c}</li>
                  <li>D. {question.option_d}</li>
                  <li className="pt-1 font-medium text-slate-900">
                    Jawaban benar: {question.correct_option}
                  </li>
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>

      {quiz?.id && <AddQuizQuestionForm quizId={quiz.id} />}
    </section>
  );
}
