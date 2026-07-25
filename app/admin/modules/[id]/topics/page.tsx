// app/admin/modules/[id]/topics/page.tsx

import Link from "next/link";
import { getModuleById, getTopicsByModuleId } from "../../../../../lib/lmsData";
import { AddTopicForm } from "./AddTopicForm";

type PageProps = {
  params:
    | {
        id?: string;
        [key: string]: unknown;
      }
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

  const { data: moduleData, error: moduleError } =
    await getModuleById(moduleIdParam);
  const { data: topics, error: topicsError } = await getTopicsByModuleId(
    Number(moduleIdParam),
  );

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
          <ol className="space-y-2">
            {topics.map((topic: any) => (
              <li
                key={topic.id}
                className="flex flex-col space-y-3 rounded-md border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">
                    {topic.order_index}. {topic.title}
                  </span>
                  <Link
                    href={`/admin/modules/${moduleIdParam}/topics/${topic.id}/quiz`}
                    className="text-sm font-medium text-slate-900 underline"
                  >
                    Kelola quiz
                  </Link>
                </div>

                {topic.description && (
                  <div 
                    className="text-sm text-slate-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: topic.description }}
                  />
                )}
                
                {topic.project_link && (
                  <div>
                    <a 
                      href={topic.project_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
                    >
                      <svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      Buka Project
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
