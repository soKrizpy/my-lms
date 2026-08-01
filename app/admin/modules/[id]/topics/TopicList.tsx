"use client";

import Link from "next/link";
import { deleteTopicAction, updateTopicAction } from "./actions";

type Topic = {
  id: number;
  title: string;
  order_index: number;
  description?: string | null;
  project_link?: string | null;
};

export function TopicList({
  initialTopics,
  moduleId,
}: {
  initialTopics: Topic[];
  moduleId: string;
}) {
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

                {topic.description && (
                  <div
                    className="prose prose-sm mt-2 max-w-none text-sm text-slate-600"
                    dangerouslySetInnerHTML={{ __html: topic.description }}
                  />
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
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
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

              <form action={updateTopicAction} className="mt-4 space-y-4">
                <input type="hidden" name="moduleId" value={moduleId} />
                <input type="hidden" name="topicId" value={topic.id} />

                <div>
                  <label
                    htmlFor={editTitleId}
                    className="block text-sm font-medium text-slate-700"
                  >
                    Judul Topik
                  </label>
                  <input
                    id={editTitleId}
                    name="title"
                    type="text"
                    required
                    defaultValue={topic.title}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor={editOrderId}
                    className="block text-sm font-medium text-slate-700"
                  >
                    Urutan (Order)
                  </label>
                  <input
                    id={editOrderId}
                    name="orderIndex"
                    type="number"
                    required
                    defaultValue={topic.order_index}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor={editDescriptionId}
                    className="block text-sm font-medium text-slate-700"
                  >
                    Deskripsi / Iframe Embed
                  </label>
                  <textarea
                    id={editDescriptionId}
                    name="description"
                    rows={3}
                    defaultValue={topic.description ?? ""}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor={editProjectLinkId}
                    className="block text-sm font-medium text-slate-700"
                  >
                    Link Project
                  </label>
                  <input
                    id={editProjectLinkId}
                    name="projectLink"
                    type="url"
                    defaultValue={topic.project_link ?? ""}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Simpan
                </button>
              </form>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
