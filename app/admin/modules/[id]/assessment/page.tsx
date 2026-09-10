// app/admin/modules/[id]/assessment/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { getModuleById, getAssessmentByModuleId, getAssessmentQuestions } from "../../../../../lib/lmsData";
import { CreateAssessmentForm } from "./CreateAssessmentForm";
import { AssessmentQuestionList } from "./AssessmentQuestionList";
import { AddAssessmentQuestionForm } from "./AddAssessmentQuestionForm";

type PageProps = {
  params:
    | { id?: string; [key: string]: unknown }
    | Promise<{ id?: string; [key: string]: unknown }>;
};

export default async function ModuleAssessmentPage({ params }: PageProps) {
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

  if (!moduleIdParam || isNaN(Number(moduleIdParam))) {
    notFound();
  }

  const { data: moduleData, error: moduleError } = await getModuleById(moduleIdParam);

  if (moduleError || !moduleData) {
    notFound();
  }

  const { data: assessment } = await getAssessmentByModuleId(Number(moduleIdParam));

  let questions: Awaited<ReturnType<typeof getAssessmentQuestions>>["data"] = [];
  if (assessment) {
    const { data: fetchedQuestions } = await getAssessmentQuestions(assessment.id);
    questions = fetchedQuestions ?? [];
  }

  const questionCount = questions?.length ?? 0;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Tryout — {moduleData.title ?? "-"}
          </h1>
          <p className="text-sm text-slate-600">
            {moduleData.description ?? "Kelola assessment akhir modul."}
          </p>
        </div>
        <Link
          href={`/admin/modules/${moduleIdParam}/topics`}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 shrink-0"
        >
          ← Kembali ke Topik
        </Link>
      </div>

      {!assessment ? (
        /* No assessment yet — show create form */
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <p className="mb-4 text-sm text-slate-600">
            Modul ini belum memiliki assessment. Buat assessment baru untuk mengaktifkan fitur tryout.
          </p>
          <CreateAssessmentForm moduleId={moduleIdParam} />
        </div>
      ) : (
        /* Assessment exists — show management UI */
        <>
          {/* Assessment title bar */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-lg">📋</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Assessment</p>
              <p className="truncate text-sm font-semibold text-slate-900">{assessment.title}</p>
            </div>
            {/* Question count badge */}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                questionCount >= 10
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {questionCount} soal
            </span>
          </div>

          {/* Warning if < 10 questions */}
          {questionCount < 10 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>
                Assessment membutuhkan minimal <strong>10 soal</strong> agar dapat digunakan oleh
                siswa. Saat ini baru ada <strong>{questionCount} soal</strong>.
              </span>
            </div>
          )}

          {/* Question list */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Daftar Soal</h2>
            {!questions || questions.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada soal. Tambahkan soal di bawah.</p>
            ) : (
              <AssessmentQuestionList
                questions={questions}
                assessmentId={assessment.id}
                moduleId={moduleIdParam}
              />
            )}
          </div>

          {/* Add question form */}
          <AddAssessmentQuestionForm
            assessmentId={assessment.id}
            moduleId={moduleIdParam}
            disabled={questionCount >= 20}
          />
        </>
      )}
    </section>
  );
}
