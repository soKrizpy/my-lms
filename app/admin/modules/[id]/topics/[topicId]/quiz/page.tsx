// app/admin/modules/[id]/topics/[topicId]/quiz/page.tsx
import { AddQuizQuestionForm } from "./AddQuizQuestionForm";
import { supabase } from "../../../../../../../lib/supabaseClient";

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

  // Ambil data topik
  const { data: topicData, error: topicError } = await supabase
    .from("topics")
    .select("id, title, module_id")
    .eq("id", Number(topicIdParam))
    .single();

  // Ambil / buat quiz untuk topik ini
  const { data: existingQuiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("topic_id", Number(topicIdParam))
    .maybeSingle();

  let quiz = existingQuiz;

  // Jika belum ada quiz, buat satu
  if (!quiz && !quizError) {
    const { data: newQuiz, error: createQuizError } = await supabase
      .from("quizzes")
      .insert({
        topic_id: Number(topicIdParam),
        title: `Quiz untuk ${topicData?.title ?? ""}`,
      })
      .select()
      .single();

    if (createQuizError) {
      return (
        <section>
          <h1>Quiz Topik</h1>
          <p style={{ color: "red" }}>
            Error membuat quiz: {createQuizError.message}
          </p>
        </section>
      );
    }

    quiz = newQuiz;
  }

  // Ambil pertanyaan untuk quiz ini
  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quiz?.id)
    .order("id", { ascending: true });

  if (topicError) {
    return (
      <section>
        <h1>Quiz Topik</h1>
        <p style={{ color: "red" }}>Error topik: {topicError.message}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Quiz untuk Topik: {topicData?.title}</h1>
      <p>Module ID: {moduleIdParam}</p>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <h2 style={{ margin: 0 }}>Daftar Pertanyaan Quiz</h2>
          {/* Tombol di sini bisa dipakai nanti untuk mode tambah 5 soal sekaligus */}
          <button
            type="button"
            style={{
              padding: "0.4rem 0.8rem",
              backgroundColor: "#0f172a",
              color: "white",
              borderRadius: 6,
              border: "none",
              cursor: "default",
              opacity: 0.7,
            }}
          >
            Tambahkan 5 soal
          </button>
        </div>

        {questionsError && (
          <p style={{ color: "red", marginBottom: "0.75rem" }}>
            Error pertanyaan: {questionsError.message}
          </p>
        )}

        {!questions || questions.length === 0 ? (
          <p>Belum ada pertanyaan untuk quiz ini.</p>
        ) : (
          <ol style={{ marginTop: "0.5rem" }}>
            {questions.map((q: any, idx: number) => (
              <li
                key={q.id}
                style={{
                  marginBottom: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "white",
                }}
              >
                <strong>
                  {idx + 1}. {q.question_text}
                </strong>
                <ul
                  style={{
                    marginTop: "0.5rem",
                    marginLeft: "1rem",
                    listStyleType: "none",
                    paddingLeft: 0,
                  }}
                >
                  <li> A. {q.option_a}</li>
                  <li> B. {q.option_b}</li>
                  <li> C. {q.option_c}</li>
                  <li> D. {q.option_d}</li>
                  <li style={{ marginTop: "0.25rem" }}>
                    Jawaban benar: <strong>{q.correct_option}</strong>
                  </li>
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Form tambah pertanyaan di bawah card daftar */}
      {quiz?.id && <AddQuizQuestionForm quizId={quiz.id} />}
    </section>
  );
}
