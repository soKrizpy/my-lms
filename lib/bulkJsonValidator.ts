// lib/bulkJsonValidator.ts
// Validates admin bulk-upload JSON payload before inserting into DB.
// All validation errors are in Bahasa Indonesia for the admin UI.

export interface BulkJsonNode {
  id: string;
  type: string;
  title: string;
  [key: string]: unknown;
}

export interface BulkJsonQuizOption {
  id: string;
  text: string;
}

export interface BulkJsonQuizQuestion {
  id: string;
  question: string;
  options: BulkJsonQuizOption[];
  correct_option_id: string;
  explanation?: string;
}

export interface BulkJsonTopic {
  title: string;
  order_index: number;
  description?: string;
  nodes: BulkJsonNode[];
  post_class_quiz: BulkJsonQuizQuestion[];
  exp_reward: number;
  coins_reward: number;
  cypeco_exp_reward: number;
}

export interface BulkJsonPayload {
  module_title: string;
  description?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  gamification_type?: string;
  topics: BulkJsonTopic[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const MIN_NODES = 10;
const MAX_NODES = 20;
const REQUIRED_OPTIONS = 5;

export function validateBulkJson(raw: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ path: 'root', message: 'JSON harus berupa objek.' }] };
  }

  const payload = raw as Record<string, unknown>;

  // module_title
  if (!payload.module_title || typeof payload.module_title !== 'string' || payload.module_title.trim() === '') {
    errors.push({ path: 'module_title', message: 'module_title wajib diisi dan harus berupa string.' });
  }

  // level
  if (!payload.level || !VALID_LEVELS.includes(payload.level as never)) {
    errors.push({ path: 'level', message: `level harus salah satu dari: ${VALID_LEVELS.join(', ')}.` });
  }

  // topics array
  if (!Array.isArray(payload.topics) || payload.topics.length === 0) {
    errors.push({ path: 'topics', message: 'topics harus berupa array dan tidak boleh kosong.' });
    return { valid: errors.length === 0, errors };
  }

  payload.topics.forEach((topic: unknown, topicIdx: number) => {
    const tPath = `topics[${topicIdx}]`;

    if (!topic || typeof topic !== 'object' || Array.isArray(topic)) {
      errors.push({ path: tPath, message: 'Setiap topik harus berupa objek.' });
      return;
    }

    const t = topic as Record<string, unknown>;
    const topicLabel = typeof t.title === 'string' ? `"${t.title}"` : `ke-${topicIdx + 1}`;

    // title
    if (!t.title || typeof t.title !== 'string' || (t.title as string).trim() === '') {
      errors.push({ path: `${tPath}.title`, message: `Topik ${topicLabel}: title wajib diisi.` });
    }

    // order_index
    if (typeof t.order_index !== 'number' || !Number.isInteger(t.order_index) || t.order_index < 1) {
      errors.push({ path: `${tPath}.order_index`, message: `Topik ${topicLabel}: order_index harus bilangan bulat >= 1.` });
    }

    // nodes
    if (!Array.isArray(t.nodes)) {
      errors.push({ path: `${tPath}.nodes`, message: `Topik ${topicLabel}: nodes harus berupa array.` });
    } else if (t.nodes.length < MIN_NODES) {
      errors.push({ path: `${tPath}.nodes`, message: `Topik ${topicLabel} hanya memiliki ${t.nodes.length} node, minimal ${MIN_NODES} node!` });
    } else if (t.nodes.length > MAX_NODES) {
      errors.push({ path: `${tPath}.nodes`, message: `Topik ${topicLabel} memiliki ${t.nodes.length} node, maksimal ${MAX_NODES} node!` });
    } else {
      (t.nodes as unknown[]).forEach((node: unknown, nodeIdx: number) => {
        const nPath = `${tPath}.nodes[${nodeIdx}]`;
        if (!node || typeof node !== 'object' || Array.isArray(node)) {
          errors.push({ path: nPath, message: `Node ke-${nodeIdx + 1} pada topik ${topicLabel} harus berupa objek.` });
          return;
        }
        const n = node as Record<string, unknown>;
        if (!n.id || typeof n.id !== 'string') {
          errors.push({ path: `${nPath}.id`, message: `Node ke-${nodeIdx + 1} pada topik ${topicLabel}: id wajib berupa string.` });
        }
        if (!n.type || typeof n.type !== 'string') {
          errors.push({ path: `${nPath}.type`, message: `Node ke-${nodeIdx + 1} pada topik ${topicLabel}: type wajib berupa string.` });
        }
        if (!n.title || typeof n.title !== 'string') {
          errors.push({ path: `${nPath}.title`, message: `Node ke-${nodeIdx + 1} pada topik ${topicLabel}: title wajib berupa string.` });
        }
      });
    }

    // post_class_quiz
    if (!Array.isArray(t.post_class_quiz) || t.post_class_quiz.length === 0) {
      errors.push({ path: `${tPath}.post_class_quiz`, message: `Topik ${topicLabel}: post_class_quiz harus berupa array dan tidak boleh kosong.` });
    } else {
      (t.post_class_quiz as unknown[]).forEach((q: unknown, qIdx: number) => {
        const qPath = `${tPath}.post_class_quiz[${qIdx}]`;
        if (!q || typeof q !== 'object' || Array.isArray(q)) {
          errors.push({ path: qPath, message: `Soal ke-${qIdx + 1} pada topik ${topicLabel} harus berupa objek.` });
          return;
        }
        const question = q as Record<string, unknown>;
        if (!question.question || typeof question.question !== 'string') {
          errors.push({ path: `${qPath}.question`, message: `Soal ke-${qIdx + 1} pada topik ${topicLabel}: question wajib berupa string.` });
        }
        if (!Array.isArray(question.options) || question.options.length !== REQUIRED_OPTIONS) {
          errors.push({ path: `${qPath}.options`, message: `Soal ke-${qIdx + 1} pada topik ${topicLabel} harus memiliki tepat ${REQUIRED_OPTIONS} pilihan jawaban (sekarang: ${Array.isArray(question.options) ? question.options.length : 0}).` });
        }
        if (!question.correct_option_id || typeof question.correct_option_id !== 'string') {
          errors.push({ path: `${qPath}.correct_option_id`, message: `Soal ke-${qIdx + 1} pada topik ${topicLabel}: correct_option_id wajib berupa string.` });
        }
      });
    }

    // rewards
    for (const rewardField of ['exp_reward', 'coins_reward', 'cypeco_exp_reward'] as const) {
      if (typeof t[rewardField] !== 'number' || (t[rewardField] as number) < 0) {
        errors.push({ path: `${tPath}.${rewardField}`, message: `Topik ${topicLabel}: ${rewardField} wajib berupa angka >= 0.` });
      }
    }
  });

  return { valid: errors.length === 0, errors };
}
