// app/admin/modules/[id]/topics/page.tsx

import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { AddTopicForm } from "./AddTopicForm";
import { TopicList } from "./TopicList";
import { CsvImportForm } from "./CsvImportForm";

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
    .select("id, title, module_id, order_index, description, project_link, topic_link, engine_topic_id, status, lesson_content")
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

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Topik untuk Modul: {moduleData?.title ?? "-"}
        </h1>
        <p className="text-sm text-slate-600">
          {moduleData?.description ?? "Tidak ada deskripsi."}
        </p>
      </div>

      <AddTopicForm moduleId={moduleIdParam} />

      <CsvImportForm moduleId={moduleIdParam} />

      {topicsError && (
        <p style={{ color: "red" }}>Error topik: {topicsError.message}</p>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Daftar Topik
        </h2>
        {!topics || topics.length === 0 ? (
          <p className="text-sm text-slate-500">
            Belum ada topik untuk modul ini.
          </p>
        ) : (
          <TopicList initialTopics={topics} moduleId={moduleIdParam} />
        )}
      </div>
    </section>
  );
}