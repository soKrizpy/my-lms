// lib/assessmentValidation.ts
// Pure validation functions for module assessment authoring.
// No external dependencies — safe to use in both server actions and tests.

// ── Assessment title ─────────────────────────────────────────────────────────

/**
 * Validates an assessment title string.
 *
 * Rules (Requirements 1.4, 1.7):
 *  - Trimmed value must be non-empty.
 *  - Trimmed value must not exceed 255 characters.
 */
export function validateAssessmentTitle(
  title: string
): { valid: true } | { valid: false; error: string } {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Judul wajib diisi.' };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: 'Judul maksimal 255 karakter.' };
  }

  return { valid: true };
}

// ── Assessment question ──────────────────────────────────────────────────────

export interface QuestionInput {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

/**
 * Validates a question submission.
 *
 * Rules (Requirements 2.1, 2.3, 2.4, 2.6):
 *  - question_text: 1–500 characters (trimmed).
 *  - option_a … option_d: each 1–200 characters (trimmed).
 *  - All four option texts must be distinct (case-sensitive).
 *  - correct_option must be exactly one of 'A', 'B', 'C', 'D'.
 *
 * All errors are collected before returning so the caller can display
 * field-level messages for every offending field in a single pass.
 */
export function validateQuestionInput(
  input: QuestionInput
): { valid: true } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // ── question_text ──────────────────────────────────────────────────────────
  const questionText = input.question_text.trim();
  if (questionText.length === 0) {
    errors['question_text'] = 'Teks soal wajib diisi.';
  } else if (questionText.length > 500) {
    errors['question_text'] = 'Teks soal maksimal 500 karakter.';
  }

  // ── option_a … option_d ────────────────────────────────────────────────────
  const optionFields: Array<[keyof QuestionInput, string]> = [
    ['option_a', 'Opsi A'],
    ['option_b', 'Opsi B'],
    ['option_c', 'Opsi C'],
    ['option_d', 'Opsi D'],
  ];

  const trimmedOptions: Record<string, string> = {};

  for (const [field, label] of optionFields) {
    const value = (input[field] as string).trim();
    trimmedOptions[field] = value;

    if (value.length === 0) {
      errors[field] = `${label} wajib diisi.`;
    } else if (value.length > 200) {
      errors[field] = `${label} maksimal 200 karakter.`;
    }
  }

  // ── distinct options check ─────────────────────────────────────────────────
  // Only run the uniqueness check when all four options are individually valid
  // (non-empty and within length); otherwise the existing length errors already
  // cover the field.
  const noLengthErrors = optionFields.every(([field]) => !(field in errors));
  if (noLengthErrors) {
    const values = optionFields.map(([field]) => trimmedOptions[field]);
    const unique = new Set(values);
    if (unique.size < 4) {
      // Attach the duplicate error to all option fields so the UI can highlight each one.
      for (const [field] of optionFields) {
        errors[field] = 'Semua pilihan jawaban harus berbeda.';
      }
    }
  }

  // ── correct_option ─────────────────────────────────────────────────────────
  const validOptions = new Set(['A', 'B', 'C', 'D']);
  if (!validOptions.has(input.correct_option)) {
    errors['correct_option'] = "Pilihan jawaban yang benar harus salah satu dari A, B, C, atau D.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
