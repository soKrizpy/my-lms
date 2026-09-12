// app/admin/modules/[id]/topics/page.tsx
// Unified module management page with three tabs:
//   Tab 1 (topics)     — existing topic management (unchanged)
//   Tab 2 (quiz)       — navigation panel linking to each topic's /quiz sub-route
//   Tab 3 (assessment) — existing assessment management (unchanged)
//
// All server actions, API routes, and component logic are untouched.
// The activeTab is resolved from the page's searchParams prop (Server Component pattern).

import Link from "next/link";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { getAssessmentByModuleId, getAssessmentQuestions } from "../../../../../lib/lmsData";
import { AddTopicForm } from "./AddTopicForm";
import { TopicList } from "./TopicList";
import { CsvImportForm } from "./CsvImportForm";
import { SeedEngineTopicsButton } from "./SeedEngineTopicsButton";
import { CreateAssessmentForm } from "../assessment/CreateAssessmentForm";
import { AssessmentQuestionList } from "../assessment/AssessmentQuestionList";
import { AddAssessmentQuestionForm } from "../assessment/AddAssessmentQuestionForm";
import ModuleTabShell, { type TabId } from "../ModuleTabShell";

type PageProps = {
  params:
    | { id?: string; [key: string]: unknown }
    | Promise<{ id?: string; [key: string]: unknown }>;
  searchParams?:
    | { tab?: string; [key: string]: unknown }
    | Promise<{ tab?: string; [key: string]: unknown }>;
};

const VALID_TABS: TabId[] = ["topics", "quiz", "assessment"];

function resolveTab(raw: string | undefined): TabId {
  if (raw && (VALID_TABS as string[]).includes(raw)) return raw as TabId;
  return "topics";
}

export default async function ModuleTopicsPage({ params, searchParams }: PageProps) {
  // ── Resolve params & searchParams (may be Promises in Next.js 15) ─────────
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};

  const moduleIdParam =
    typeof resolvedParams?.id === "string" ? resolvedParams.id : undefined;

  if (!moduleIdParam) {
    return (
      <section>
        <h1>Topik Modul</h1>
        <p className="text-red-600">ID modul tidak valid.</p>
      </section>
    );
  }

  const activeTab = resolveTab(
    typeof resolvedSearch?.tab === "string" ? resolvedSearch.tab : undefined
  );

  // ── Data fetching ─────────────────────────────────────────────────────────
  const supabaseAdmin = getSupabaseAdmin();

  const [
    { data: moduleData, error: moduleError },
    { data: topics, error: topicsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("modules")
      .select("id, title, description")
      .eq("id", Number(moduleIdParam))
      .maybeSingle(),
    supabaseAdmin
      .from("topics")
      .select(
        "id, title, module_id, order_index, description, project_link, topic_link, engine_topic_id, status, lesson_content, published_at"
      )
      .eq("module_id", Number(moduleIdParam))
      .order("order_index", { ascending: true }),
  ]);

  if (moduleError) {
    return (
      <section>
        <h1>Topik Modul</h1>
        <p className="text-red-600">Error modul: {moduleError.message}</p>
      </section>
    );
  }

  // Assessment data (needed for Tab 3 regardless of active tab — fetched server-side)
  const { data: assessment } = await getAssessmentByModuleId(Number(moduleIdParam));

  let questions: Awaited<ReturnType<typeof getAssessmentQuestions>>["data"] = [];
  if (assessment) {
    const { data: fetchedQuestions } = await getAssessmentQuestions(assessment.id);
    questions = fetchedQuestions ?? [];
  }

  const questionCount = questions?.length ?? 0;

  const usedEngineTopicIds = (topics ?? [])
    .map((t) => t.engine_topic_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  // ── Tab 1: Topics ─────────────────────────────────────────────────────────
  const topicsTabContent = (
    <div className="space-y-6">
      {/* Section 0: Sync from Engine */}
      <div className="rounded-lg border-2 border-green-200 bg-green-50/40 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Sync dari Lesson Engine</h2>
            <p className="text-xs text-slate-500">
              Tambahkan semua lesson bawaan dari engine ke modul ini sekaligus. Pilih kategori —
              semua topik langsung ter-publish dan siap dipakai siswa.
            </p>
          </div>
        </div>
        <SeedEngineTopicsButton moduleId={moduleIdParam} />
      </div>

      {/* Section 1: Manual input + topic list */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50/40 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Input Manual</h2>
            <p className="text-xs text-slate-500">
              Tambah topik satu per satu, hubungkan ke lesson engine bawaan, dan set publish.
            </p>
          </div>
        </div>
        <AddTopicForm moduleId={moduleIdParam} usedEngineTopicIds={usedEngineTopicIds} />
        {topicsError && (
          <p className="text-sm text-red-600">Error: {topicsError.message}</p>
        )}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Daftar Topik</h3>
          {!topics || topics.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada topik untuk modul ini.</p>
          ) : (
            <TopicList initialTopics={topics} moduleId={moduleIdParam} />
          )}
        </div>
      </div>

      {/* Section 2: Bulk CSV upload */}
      <div className="rounded-lg border-2 border-purple-200 bg-purple-50/40 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Bulk Upload via CSV</h2>
            <p className="text-xs text-slate-500">
              Upload banyak konten lesson sekaligus. Setiap lesson harus sudah punya topik
              (dibuat via Input Manual). Setelah upload, klik Publish di daftar topik.
            </p>
          </div>
        </div>
        <CsvImportForm moduleId={moduleIdParam} />
      </div>
    </div>
  );

  // ── Tab 2: Quiz navigation ─────────────────────────────────────────────────
  const quizTabContent = (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Klik topik di bawah untuk mengelola quiz-nya. Setiap topik memiliki quiz tersendiri
          yang berisi soal pilihan ganda untuk siswa.
        </p>
      </div>

      {!topics || topics.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            Belum ada topik. Tambahkan topik di tab{" "}
            <Link
              href={`?tab=topics`}
              replace
              scroll={false}
              className="font-semibold text-brand-primary underline underline-offset-2"
            >
              📚 Topik
            </Link>{" "}
            terlebih dahulu.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/admin/modules/${moduleIdParam}/topics/${topic.id}/quiz`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-brand-primary hover:bg-brand-primary/5"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-slate-900">
                    {topic.order_index}. {topic.title}
                  </span>
                  {topic.engine_topic_id && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      🔗 {topic.engine_topic_id}
                    </span>
                  )}
                </div>
                <span className="ml-3 shrink-0 text-xs font-semibold text-brand-primary">
                  Kelola Quiz →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // ── Tab 3: Assessment / Tryout ─────────────────────────────────────────────
  const assessmentTabContent = (
    <div className="space-y-6">
      {!assessment ? (
        /* No assessment yet */
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <p className="mb-4 text-sm text-slate-600">
            Modul ini belum memiliki assessment. Buat assessment baru untuk mengaktifkan fitur
            tryout.
          </p>
          <CreateAssessmentForm moduleId={moduleIdParam} />
        </div>
      ) : (
        <>
          {/* Assessment title bar */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-lg">📋</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Assessment
              </p>
              <p className="truncate text-sm font-semibold text-slate-900">
                {assessment.title}
              </p>
            </div>
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

          {/* Warning: fewer than 10 questions */}
          {questionCount < 10 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>
                Assessment membutuhkan minimal <strong>10 soal</strong> agar dapat digunakan
                siswa. Saat ini baru ada <strong>{questionCount} soal</strong>.
              </span>
            </div>
          )}

          {/* Question list */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Daftar Soal</h2>
            {!questions || questions.length === 0 ? (
              <p className="text-sm text-slate-500">
                Belum ada soal. Tambahkan soal di bawah.
              </p>
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
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ModuleTabShell
      moduleTitle={moduleData?.title ?? "—"}
      moduleDescription={moduleData?.description}
      activeTab={activeTab}
      tabs={{
        topics: topicsTabContent,
        quiz: quizTabContent,
        assessment: assessmentTabContent,
      }}
    />
  );
}
