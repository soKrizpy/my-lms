"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { getSessionRole } from "../../../lib/auth";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateModules() {
  revalidatePath("/admin/modules");
}

async function requireAdminAction() {
  if (await getSessionRole() !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function createModuleAction(formData: FormData) {
  await requireAdminAction();
  const name = readString(formData, "name");
  const description = readString(formData, "description");
  const level = readString(formData, "level") || "beginner";
  const gamification_type = readString(formData, "gamification_type") || "mimo";

  if (!name) {
    throw new Error("Nama modul wajib diisi.");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("modules").insert({
    title: name,
    description,
    level,
    gamification_type,
  });

  if (error) throw error;

  revalidateModules();
}

export async function updateModuleAction(formData: FormData) {
  await requireAdminAction();
  const id = readString(formData, "id");
  const name = readString(formData, "name");
  const description = readString(formData, "description");
  const level = readString(formData, "level") || "beginner";
  const gamification_type = readString(formData, "gamification_type") || "mimo";

  if (!id || !name) {
    throw new Error("ID dan Nama modul wajib diisi.");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("modules")
    .update({ title: name, description, level, gamification_type })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Modul tidak ditemukan.");

  revalidateModules();
}

export async function deleteModuleAction(formData: FormData) {
  await requireAdminAction();
  const id = readString(formData, "id");

  if (!id) {
    throw new Error("ID modul wajib diisi.");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("modules").delete().eq("id", id);

  if (error) throw error;

  revalidateModules();
}

export async function publishAllTopicsAction(moduleId: number) {
  if (await getSessionRole() !== "admin") return { error: "Unauthorized" };

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("topics")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("module_id", moduleId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/modules/${moduleId}/topics`);
  revalidatePath("/admin/modules");
  return { success: true };
}

export async function unpublishAllTopicsAction(moduleId: number) {
  if (await getSessionRole() !== "admin") return { error: "Unauthorized" };

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("topics")
    .update({ status: "draft", published_at: null })
    .eq("module_id", moduleId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/modules/${moduleId}/topics`);
  revalidatePath("/admin/modules");
  return { success: true };
}
