"use client";

// PublishAllTopicsButton.tsx
// Quick header button to publish/unpublish all topics in a module at once.

import { useTransition } from "react";
import { publishAllTopicsInModuleAction, unpublishAllTopicsInModuleAction } from "./actions";

interface TopicStub { status?: string | null; }

interface Props {
  moduleId: string;
  topics: TopicStub[];
}

export function PublishAllTopicsButton({ moduleId, topics }: Props) {
  const [isPending, startTransition] = useTransition();

  const allPublished = topics.length > 0 && topics.every((t) => t.status === "published");
  const nonePublished = topics.every((t) => t.status !== "published");
  const publishedCount = topics.filter((t) => t.status === "published").length;

  function handleClick() {
    const formData = new FormData();
    formData.set("moduleId", moduleId);
    startTransition(async () => {
      const action = allPublished ? unpublishAllTopicsInModuleAction : publishAllTopicsInModuleAction;
      const result = await action(formData);
      if (result && "error" in result && result.error) {
        alert("Gagal: " + result.error);
      }
      // Page auto-revalidates via revalidatePath in the action
    });
  }

  if (topics.length === 0) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
        allPublished
          ? "border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50"
          : "bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-sm"
      }`}
    >
      {isPending ? (
        <>
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Memproses...
        </>
      ) : allPublished ? (
        "📦 Jadikan Draft Semua"
      ) : nonePublished ? (
        `📢 Publish Semua (${topics.length})`
      ) : (
        `📢 Publish Sisa (${topics.length - publishedCount})`
      )}
    </button>
  );
}
