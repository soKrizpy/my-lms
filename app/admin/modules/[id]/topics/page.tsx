// app/admin/modules/[id]/topics/page.tsx
// Unified module management page with three tabs:
//   Tab 1 (topics)     — topic management (JSON-only workflow)
//   Tab 2 (quiz)       — navigation panel linking to each topic's /quiz sub-route
//   Tab 3 (assessment) — assessment / tryout management

import Link from "next/link";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { getAssessmentByModuleId, getAssessmentQuestions } from "../../../../../lib/lmsData";
import { TopicList } from "./TopicList";
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

  const supabaseAdmin = getSupabaseAdmin();

  const [
    { data: moduleData, error: moduleError },
    { data: topics, error: topicsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("modules")
      .select("id, title, description, level, gamification_type")
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

  const { data: assessment } = await getAssessmentByModuleId(Number(moduleIdParam));

  let questions: Awaited<ReturnType<typeof getAssessmentQuestions>>["data"] = [];
  if (assessment) {
    const { data: fetchedQuestions } = await getAssessmentQuestions(assessment.id);
    questions = fetchedQuestions ?? [];
  }

  const questionCount = questions?.length ?? 0;

  // ── Tab 1: Topics ─────────────────────────────────────────────────────────
  const topicsTabContent = (
    <div className="space-y-6">
      {/* Info banner — JSON workflow */}
      <div className="flex items-start gap-3 rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/30 p-4">
        <span className="text-xl mt-0.5">📦</span>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-violet-800 dark:text-violet-200 mb-1">
            Topik dibuat via Bulk Upload JSON
          </h2>
          <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
            Untuk menambah atau mengganti topik, gunakan tombol{" "}
            <strong>+ Create New Module</strong> dari halaman{" "}
            <Link
              href="/admin/modules"
              className="underline underline-offset-2 hover:text-violet-900 dark:hover:text-violet-100"
            >
              Kelola Modul
            </Link>{" "}
            dan pilih{" "}
            <strong>Option D: Bulk Upload via JSON</strong>. File JSON berisi semua topik,
            node materi (10–20 per topik), dan quiz post-class sekaligus.
          </p>
        </div>
      </div>

      {/* Topic list */}
      {topicsError && (
        <p className="text-sm text-red-600">Error: {topicsError.message}</p>
      )}
      <div className="glass-panel rounded-xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Daftar Topik ({topics?.length ?? 0})
        </h3>
        {!topics || topics.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic">
            Belum ada topik untuk modul ini. Upload JSON terlebih dahulu.
          </p>
        ) : (
          <TopicList initialTopics={topics} moduleId={moduleIdParam} />
        )}
      </div>
    </div>
  );

  // ── Tab 2: Quiz navigation ─────────────────────────────────────────────────
  const quizTabContent = (
    <div className="space-y-4">
      <div className="glass-panel rounded-lg p-4 space-y-2">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Topik yang sudah memiliki quiz JSONB (dari JSON upload) menampilkan badge{" "}
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">✅ Quiz JSONB</span>{" "}
          — quiznya dikelola via <strong>✏️ Edit Materi → tab Quiz</strong>.
        </p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Topik lama tanpa JSONB quiz tetap bisa menggunakan <strong>Kelola quiz</strong> (System A) di sini.
        </p>
      </div>

      {!topics || topics.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--glass-border)] bg-[var(--glass-bg)] p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Belum ada topik. Upload JSON di tab{" "}
            <Link
              href="?tab=topics"
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
                className="flex items-center justify-between glass-panel rounded-lg px-4 py-3 transition-colors hover:border-brand-primary hover:bg-brand-primary/5"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {topic.order_index}. {topic.title}
                  </span>
                  {topic.engine_topic_id && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                      🔗 {topic.engine_topic_id}
                    </span>
                  )}
                  <span className={`ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                    topic.status === "published"
                      ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-400"
                  }`}>
                    {topic.status === "published" ? "✅ Published" : "⚠️ Draft"}
                  </span>
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

  // ── Tab 3: Assessment ──────────────────────────────────────────────────────
  const assessmentTabContent = (
    <div className="space-y-6">
      {!assessment ? (
        <div className="glass-panel rounded-lg p-6">
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            Modul ini belum memiliki assessment. Buat assessment baru untuk mengaktifkan fitur tryout.
          </p>
          <CreateAssessmentForm moduleId={moduleIdParam} />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 glass-panel rounded-lg px-4 py-3">
            <span className="text-lg">📋</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Assessment
              </p>
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {assessment.title}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              questionCount >= 10 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
            }`}>
              {questionCount} soal
            </span>
          </div>

          {questionCount < 10 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>
                Assessment membutuhkan minimal <strong>10 soal</strong> agar dapat digunakan siswa.
                Saat ini baru ada <strong>{questionCount} soal</strong>.
              </span>
            </div>
          )}

          <div className="glass-panel rounded-lg p-4">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Daftar Soal</h2>
            {!questions || questions.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Belum ada soal. Tambahkan soal di bawah.</p>
            ) : (
              <AssessmentQuestionList
                questions={questions}
                assessmentId={assessment.id}
                moduleId={moduleIdParam}
              />
            )}
          </div>

          <AddAssessmentQuestionForm
            assessmentId={assessment.id}
            moduleId={moduleIdParam}
            disabled={questionCount >= 20}
          />
        </>
      )}
    </div>
  );

  const firstTopicEngineId =
    (topics ?? []).find((t) => t.engine_topic_id)?.engine_topic_id ?? null;

  return (
    <ModuleTabShell
      moduleId={moduleIdParam}
      moduleTitle={moduleData?.title ?? "—"}
      moduleDescription={moduleData?.description}
      moduleLevel={moduleData?.level}
      gamificationType={moduleData?.gamification_type}
      firstTopicEngineId={firstTopicEngineId}
      activeTab={activeTab}
      tabs={{
        topics: topicsTabContent,
        quiz: quizTabContent,
        assessment: assessmentTabContent,
      }}
    />
  );
}
