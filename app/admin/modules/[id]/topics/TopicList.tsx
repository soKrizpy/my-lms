"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteTopicAction, updateTopicAction, publishTopicAction, unpublishTopicAction } from "./actions";
import { BUILT_IN_LESSONS } from "../../../../../lib/builtInLessons";

type Topic = {
  id: number;
  title: string;
  order_index: number;
  description?: string | null;
  project_link?: string | null;
  topic_link?: string | null;
  engine_topic_id?: string | null;
  status?: string | null;
  lesson_content?: unknown | null;
  published_at?: string | null;
};

export function TopicList({
  initialTopics,
  moduleId,
}: {
  initialTopics: Topic[];
  moduleId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [openSynopsis, setOpenSynopsis] = useState<Record<number, boolean>>({});

  const toggleSynopsis = (topicId: number) =>
    setOpenSynopsis((prev) => ({ ...prev, [topicId]: !prev[topicId] }));

  if (!initialTopics || initialTopics.length === 0) {
    return (
      <p className="text-sm text-slate-500">Belum ada topik untuk modul ini.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {initialTopics.map((topic) => {
        const editTitleId = `topic-${topic.id}-title`;
        const editOrderId = `topic-${topic.id}-order`;
        const editDescriptionId = `topic-${topic.id}-description`;
        const editProjectLinkId = `topic-${topic.id}-project-link`;
        const editTopicLinkId = `topic-${topic.id}-topic-link`;
        const editEngineTopicId = `topic-${topic.id}-engine-topic-id`;

        return (
          <li
            key={topic.id}
            className="flex flex-col space-y-3 rounded-md border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-slate-800">
                  {topic.order_index}. {topic.title}
                </span>

                {topic.engine_topic_id && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <span>🔗</span>
                      <code className="font-mono">{topic.engine_topic_id}</code>
                    </span>
                    {topic.lesson_content ? (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                        topic.status === 'published'
                          ? 'bg-green-50 text-green-700 border-green-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {topic.status === 'published'
                          ? `✅ Published${topic.published_at ? ` · ${new Date(topic.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}`
                          : '📝 Draft'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        belum ada konten
                      </span>
                    )}
                  </div>
                )}

                {topic.description && (
                  <>
                    <button
                      onClick={() => toggleSynopsis(topic.id)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium"
                    >
                      <span>{openSynopsis[topic.id] ? "Tutup sinopsis" : "Lihat sinopsis"}</span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${openSynopsis[topic.id] ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openSynopsis[topic.id] && (
                      <div
                        className="prose prose-sm mt-2 max-w-none text-sm text-slate-600 max-h-48 overflow-y-auto pr-2 border-l-2 border-blue-100 pl-2 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: topic.description }}
                      />
                    )}
                  </>
                )}

                {topic.project_link && (
                  <div className="mt-2">
                    <a
                      href={topic.project_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
                    >
                      <svg
                        className="mr-1.5 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24" height="24" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Buka Project
                    </a>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/modules/${moduleId}/topics/${topic.id}/quiz`}
                  className="text-sm font-medium text-slate-900 underline"
                >
                  Kelola quiz
                </Link>
                {Boolean(topic.lesson_content) && (
                  <form action={topic.status === 'published' ? unpublishTopicAction : publishTopicAction}>
                    <input type="hidden" name="moduleId" value={moduleId} />
                    <input type="hidden" name="topicId" value={topic.id} />
                    <button
                      type="submit"
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                        topic.status === 'published'
                          ? 'border border-amber-300 text-amber-700 hover:bg-amber-50'
                          : 'border border-green-300 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      {topic.status === 'published' ? '📤 Unpublish' : '🚀 Publish'}
                    </button>
                  </form>
                )}
                <form action={deleteTopicAction}>
                  <input type="hidden" name="moduleId" value={moduleId} />
                  <input type="hidden" name="topicId" value={topic.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </form>
              </div>
            </div>

            <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                Edit Topik
              </summary>

              <form
                action={(formData) => {
                  startTransition(async () => {
                    try {
                      await updateTopicAction(formData);
                      alert("Topik berhasil disimpan!");
                    } catch (err: unknown) {
                      alert("Gagal menyimpan topik: " + (err instanceof Error ? err.message : String(err)));
                    }
                  });
                }}
                className="mt-4 space-y-4"
              >
                <input type="hidden" name="moduleId" value={moduleId} />
                <input type="hidden" name="topicId" value={topic.id} />

                <div>
                  <label htmlFor={editTitleId} className="block text-sm font-medium text-slate-700">
                    Judul Topik
                  </label>
                  <input
                    id={editTitleId} name="title" type="text" required
                    defaultValue={topic.title}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor={editOrderId} className="block text-sm font-medium text-slate-700">
                    Urutan (Order)
                  </label>
                  <input
                    id={editOrderId} name="orderIndex" type="number" required
                    defaultValue={topic.order_index}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor={editDescriptionId} className="block text-sm font-medium text-slate-700">
                    Deskripsi Topik
                  </label>
                  <textarea
                    id={editDescriptionId} name="description" rows={3}
                    defaultValue={topic.description ?? ""}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor={editProjectLinkId} className="block text-sm font-medium text-slate-700">
                    Link Project
                  </label>
                  <input
                    id={editProjectLinkId} name="projectLink" type="text"
                    defaultValue={topic.project_link ?? ""}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://github.com/..."
                  />
                </div>

                <div>
                  <label htmlFor={editEngineTopicId} className="block text-sm font-medium text-slate-700">
                    Hubungkan ke Lesson Engine (Opsional)
                  </label>
                  <select
                    id={editEngineTopicId} name="engineTopicId"
                    defaultValue={topic.engine_topic_id ?? ""}
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Tidak dihubungkan —</option>
                    <optgroup label="HTML">
                      {BUILT_IN_LESSONS.filter(l => l.category === 'HTML').map(l => (
                        <option key={l.id} value={l.id}>{l.id} — {l.title}</option>
                      ))}
                    </optgroup>
                    <optgroup label="CSS">
                      {BUILT_IN_LESSONS.filter(l => l.category === 'CSS').map(l => (
                        <option key={l.id} value={l.id}>{l.id} — {l.title}</option>
                      ))}
                    </optgroup>
                    <optgroup label="JavaScript">
                      {BUILT_IN_LESSONS.filter(l => l.category === 'JavaScript').map(l => (
                        <option key={l.id} value={l.id}>{l.id} — {l.title}</option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Lesson bawaan yang dibuka siswa saat "Mulai Belajar".</p>
                </div>

                <div>
                  <label htmlFor={editTopicLinkId} className="block text-sm font-medium text-slate-700">
                    Embed Canva / Topic Link
                  </label>
                  <textarea
                    id={editTopicLinkId} name="topicLink" rows={3}
                    defaultValue={topic.topic_link ?? ""}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste kode embed iframe Canva di sini"
                  />
                </div>

                <button
                  type="submit" disabled={isPending}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </form>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
