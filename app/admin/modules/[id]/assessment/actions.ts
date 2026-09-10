"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import {
  validateAssessmentTitle,
  validateQuestionInput,
} from "../../../../../lib/assessmentValidation";

export type ActionResult = { success: true } | { error: string };

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function assessmentPath(moduleId: string | number) {
  return `/admin/modules/${moduleId}/assessment`;
}

// ── Assessment CRUD ───────────────────────────────────────────────────────────

export async function createAssessmentAction(
  formData: FormData,
): Promise<ActionResult> {
  const moduleId = readString(formData, "moduleId");
  const title = readString(formData, "title");

  if (!moduleId) {
    return { error: "ID modul wajib diisi." };
  }

  const validation = validateAssessmentTitle(title);
  if (!validation.valid) {
    return { error: validation.error };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("module_assessments").insert({
    module_id: Number(moduleId),
    title,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Modul ini sudah memiliki assessment." };
    }
    return { error: error.message };
  }

  revalidatePath(assessmentPath(moduleId));
  return { success: true };
}

export async function updateAssessmentAction(
  formData: FormData,
): Promise<ActionResult> {
  const assessmentId = Number(readString(formData, "assessmentId"));
  const moduleId = readString(formData, "moduleId");
  const title = readString(formData, "title");

  if (!assessmentId || !moduleId) {
    return { error: "ID assessment dan ID modul wajib diisi." };
  }

  const validation = validateAssessmentTitle(title);
  if (!validation.valid) {
    return { error: validation.error };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("module_assessments")
    .update({ title })
    .eq("id", assessmentId);

  if (error) return { error: error.message };

  revalidatePath(assessmentPath(moduleId));
  return { success: true };
}

export async function deleteAssessmentAction(
  formData: FormData,
): Promise<ActionResult> {
  const assessmentId = Number(readString(formData, "assessmentId"));
  const moduleId = readString(formData, "moduleId");

  if (!assessmentId || !moduleId) {
    return { error: "ID assessment dan ID modul wajib diisi." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("module_assessments")
    .delete()
    .eq("id", assessmentId);

  if (error) return { error: error.message };

  revalidatePath(assessmentPath(moduleId));
  return { success: true };
}

// ── Question CRUD ─────────────────────────────────────────────────────────────

export async function addQuestionAction(
  formData: FormData,
): Promise<ActionResult> {
  const assessmentId = Number(readString(formData, "assessmentId"));
  const moduleId = readString(formData, "moduleId");

  if (!assessmentId || !moduleId) {
    return { error: "ID assessment dan ID modul wajib diisi." };
  }

  const input = {
    question_text: readString(formData, "question_text"),
    option_a: readString(formData, "option_a"),
    option_b: readString(formData, "option_b"),
    option_c: readString(formData, "option_c"),
    option_d: readString(formData, "option_d"),
    correct_option: readString(formData, "correct_option"),
  };

  const validation = validateQuestionInput(input);
  if (!validation.valid) {
    return { error: Object.values(validation.errors).join(" ") };
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Check current question count — enforce ≤ 20
  const { count, error: countError } = await supabaseAdmin
    .from("module_assessment_questions")
    .select("id", { count: "exact", head: true })
    .eq("assessment_id", assessmentId);

  if (countError) return { error: countError.message };

  if ((count ?? 0) >= 20) {
    return { error: "Batas 20 soal tercapai." };
  }

  // Compute next order_index
  const { data: maxRow, error: maxError } = await supabaseAdmin
    .from("module_assessment_questions")
    .select("order_index")
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxError) return { error: maxError.message };

  const orderIndex =
    maxRow != null && typeof maxRow.order_index === "number"
      ? maxRow.order_index + 1
      : 0;

  const { error: insertError } = await supabaseAdmin
    .from("module_assessment_questions")
    .insert({
      assessment_id: assessmentId,
      question_text: input.question_text,
      option_a: input.option_a,
      option_b: input.option_b,
      option_c: input.option_c,
      option_d: input.option_d,
      correct_option: input.correct_option,
      order_index: orderIndex,
    });

  if (insertError) return { error: insertError.message };

  revalidatePath(assessmentPath(moduleId));
  return { success: true };
}

export async function updateQuestionAction(
  formData: FormData,
): Promise<ActionResult> {
  const questionId = Number(readString(formData, "questionId"));
  const assessmentId = Number(readString(formData, "assessmentId"));
  const moduleId = readString(formData, "moduleId");

  if (!questionId || !assessmentId || !moduleId) {
    return { error: "ID soal, ID assessment, dan ID modul wajib diisi." };
  }

  const input = {
    question_text: readString(formData, "question_text"),
    option_a: readString(formData, "option_a"),
    option_b: readString(formData, "option_b"),
    option_c: readString(formData, "option_c"),
    option_d: readString(formData, "option_d"),
    correct_option: readString(formData, "correct_option"),
  };

  const validation = validateQuestionInput(input);
  if (!validation.valid) {
    return { error: Object.values(validation.errors).join(" ") };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("module_assessment_questions")
    .update({
      question_text: input.question_text,
      option_a: input.option_a,
      option_b: input.option_b,
      option_c: input.option_c,
      option_d: input.option_d,
      correct_option: input.correct_option,
    })
    .eq("id", questionId)
    .eq("assessment_id", assessmentId);

  if (error) return { error: error.message };

  revalidatePath(assessmentPath(moduleId));
  return { success: true };
}

export async function deleteQuestionAction(
  formData: FormData,
): Promise<ActionResult> {
  const questionId = Number(readString(formData, "questionId"));
  const moduleId = readString(formData, "moduleId");

  if (!questionId || !moduleId) {
    return { error: "ID soal dan ID modul wajib diisi." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("module_assessment_questions")
    .delete()
    .eq("id", questionId);

  if (error) return { error: error.message };

  revalidatePath(assessmentPath(moduleId));
  return { success: true };
}
