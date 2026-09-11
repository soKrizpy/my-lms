// app/admin/modules/[id]/topics/page.tsx

import Link from "next/link";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { AddTopicForm } from "./AddTopicForm";
import { TopicList } from "./TopicList";
import { CsvImportForm } from "./CsvImportForm";
import { SeedEngineTopicsButton } from "./SeedEngineTopicsButton";

type PageProps = {
  params:
    | { id?: string; [key: string]: unknown }
    | Promise<{ id?: string; [key: string]: unknown }>;
};

export default async function ModuleTopicsPage({ params }: PageProps) {
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

  if (!moduleIdParam) {
    return (
      <section>
        <h1>Topik Modul</h1>
        <p style={{ color: "red" }}>ID modul tidak valid.</p>
      </section>
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: moduleData, error: moduleError } = await supabaseAdmin
    .from("modules")
    .select("id, title, description")
    .eq("id", Number(moduleIdParam))
    .maybeSingle();

  const { data: topics, error: topicsError } = await supabaseAdmin
    .from("topics")
    .select("id, title, module_id, order_index, description, project_link, topic_link, engine_topic_id, status, lesson_content, published_at")
    .eq("module_id", Number(moduleIdParam))
    .order("order_index", { ascending: true });

  if (moduleError) {
    return (
      <section>
        <h1>Topik Modul</h1>
        <p style={{ color: "red" }}>Error modul: {moduleError.message}</p>
      </section>
    );
  }

  const usedEngineTopicIds = (topics ?? [])
    .map((t) => t.engine_topic_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Topik — {moduleData?.title ?? '-'}
          </h1>
          <p className="text-sm text-slate-500">{moduleData?.description ?? ''}</p>
        </div>
        <Link
          href={`/admin/modules/${moduleIdParam}/assessment`}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 shrink-0"
        >
          📋 Kelola Tryout
        </Link>
      </div>

      {/* Section 0: Sync from Engine Lessons */}
      <div className="rounded-lg border-2 border-green-200 bg-green-50/40 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Sync dari Lesson Engine</h2>
            <p className="text-xs text-slate-500">Tambahkan semua lesson bawaan dari engine ke modul ini sekaligus. Pilih kategori — semua topik langsung ter-publish dan siap dipakai siswa.</p>
          </div>
        </div>
        <SeedEngineTopicsButton moduleId={moduleIdParam} />
      </div>

      {/* Section 1: Add topic + Topic list */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50/40 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Input Manual</h2>
            <p className="text-xs text-slate-500">Tambah topik satu per satu, hubungkan ke lesson engine bawaan, dan set publish.</p>
          </div>
        </div>
        <AddTopicForm moduleId={moduleIdParam} usedEngineTopicIds={usedEngineTopicIds} />
        {topicsError && <p className="text-sm text-red-600">Error: {topicsError.message}</p>}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Daftar Topik</h3>
          {!topics || topics.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada topik untuk modul ini.</p>
          ) : (
            <TopicList initialTopics={topics} moduleId={moduleIdParam} />
          )}
        </div>
      </div>

      {/* Section 2: CSV bulk upload */}
      <div className="rounded-lg border-2 border-purple-200 bg-purple-50/40 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Bulk Upload via CSV</h2>
            <p className="text-xs text-slate-500">Upload banyak konten lesson sekaligus. Setiap lesson harus sudah punya topik (dibuat via Input Manual). Setelah upload, klik Publish di daftar topik.</p>
          </div>
        </div>
        <CsvImportForm moduleId={moduleIdParam} />
      </div>
    </section>
  );
}