"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function topicPath(moduleId: string) {
  return `/admin/modules/${moduleId}/topics`;
}

export async function createTopicAction(formData: FormData) {
  const moduleId = readString(formData, "moduleId");
  const title = readString(formData, "title");
  const orderIndex = Number(readString(formData, "orderIndex"));
  const description = readString(formData, "description");
  const projectLink = readString(formData, "projectLink");
  const topicLink = readString(formData, "topicLink");
  const engineTopicId = readString(formData, "engineTopicId");

  if (!moduleId || !title || !Number.isFinite(orderIndex)) {
    return { error: "ID modul, judul, dan urutan topik wajib diisi." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("topics").insert({
    module_id: Number(moduleId),
    title,
    order_index: orderIndex,
    description: description || null,
    project_link: projectLink || null,
    topic_link: topicLink || null,
    engine_topic_id: engineTopicId || null,
  });

  if (error) {
    // Unique constraint on engine_topic_id
    if (error.code === "23505") {
      return { error: `Lesson Engine ID "${engineTopicId}" sudah digunakan oleh topik lain. Pilih ID yang berbeda atau kosongkan.` };
    }
    return { error: error.message };
  }

  revalidatePath(topicPath(moduleId));
  revalidatePath("/admin/modules");
  return { success: true };
}

export async function updateTopicAction(formData: FormData) {
  const moduleId = readString(formData, "moduleId");
  const topicId = Number(readString(formData, "topicId"));
  const title = readString(formData, "title");
  const orderIndex = Number(readString(formData, "orderIndex"));
  const description = readString(formData, "description");
  const projectLink = readString(formData, "projectLink");
  const topicLink = readString(formData, "topicLink");
  const engineTopicId = readString(formData, "engineTopicId");

  if (!moduleId || !topicId || !title || !Number.isFinite(orderIndex)) {
    return { error: "ID, judul, dan urutan topik wajib diisi." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("topics")
    .update({
      title,
      order_index: orderIndex,
      description: description || null,
      project_link: projectLink || null,
      topic_link: topicLink || null,
      engine_topic_id: engineTopicId || null,
    })
    .eq("id", topicId)
    .eq("module_id", Number(moduleId));

  if (error) {
    if (error.code === "23505") {
      return { error: `Lesson Engine ID "${engineTopicId}" sudah digunakan oleh topik lain. Pilih ID yang berbeda atau kosongkan.` };
    }
    return { error: error.message };
  }

  revalidatePath(topicPath(moduleId));
  revalidatePath("/admin/modules");
  return { success: true };
}

export async function deleteTopicAction(formData: FormData) {
  const moduleId = readString(formData, "moduleId");
  const topicId = Number(readString(formData, "topicId"));

  if (!moduleId || !topicId) {
    return { error: "ID topik wajib diisi." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("topics").delete().eq("id", topicId);

  if (error) return { error: error.message };

  revalidatePath(topicPath(moduleId));
  revalidatePath("/admin/modules");
  return { success: true };
}

export async function publishTopicAction(formData: FormData) {
  const moduleId = readString(formData, "moduleId");
  const topicId = Number(readString(formData, "topicId"));

  if (!moduleId || !topicId) {
    return { error: "ID topik wajib diisi." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("topics")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", topicId)
    .eq("module_id", Number(moduleId));

  if (error) return { error: error.message };

  revalidatePath(topicPath(moduleId));
  return { success: true };
}

export async function unpublishTopicAction(formData: FormData) {
  const moduleId = readString(formData, "moduleId");
  const topicId = Number(readString(formData, "topicId"));

  if (!moduleId || !topicId) {
    return { error: "ID topik wajib diisi." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("topics")
    .update({
      status: "draft",
      published_at: null,
    })
    .eq("id", topicId)
    .eq("module_id", Number(moduleId));

  if (error) return { error: error.message };

  revalidatePath(topicPath(moduleId));
  return { success: true };
}
