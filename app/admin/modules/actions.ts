"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateModules() {
  revalidatePath("/admin/modules");
}

export async function createModuleAction(formData: FormData) {
  const name = readString(formData, "name");
  const description = readString(formData, "description");
  const level = readString(formData, "level") || "beginner";

  if (!name) {
    throw new Error("Nama modul wajib diisi.");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("modules").insert({
    title: name,
    description,
    level,
  });

  if (error) throw error;

  revalidateModules();
}

export async function updateModuleAction(formData: FormData) {
  const id = readString(formData, "id");
  const name = readString(formData, "name");
  const description = readString(formData, "description");
  const level = readString(formData, "level") || "beginner";

  if (!id || !name) {
    throw new Error("ID dan Nama modul wajib diisi.");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("modules")
    .update({ title: name, description, level })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Modul tidak ditemukan.");

  revalidateModules();
}

export async function deleteModuleAction(formData: FormData) {
  const id = readString(formData, "id");

  if (!id) {
    throw new Error("ID modul wajib diisi.");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("modules").delete().eq("id", id);

  if (error) throw error;

  revalidateModules();
}
