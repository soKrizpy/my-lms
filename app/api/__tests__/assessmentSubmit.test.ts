/**
 * Integration Tests: POST /api/student/assessment/submit
 *
 * Tests the submit route handler directly using mocked Supabase clients
 * and moduleCompletion — same pattern as dashboard.test.ts.
 *
 * Test 1 — Attempt limit enforcement    (Req 5.1, 5.4 — Property 8)
 * Test 2 — Valid first submission        (Req 4.3, 9.1)
 * Test 3 — Missing answer returns 400   (Req 4.2)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock declarations (must come before imports of the mocked modules) ──────

vi.mock('../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('../../../lib/supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('../../../lib/moduleCompletion', () => ({
  resolveModuleCompletionMap: vi.fn(),
}));

// ── Imports after mocks ──────────────────────────────────────────────────────

import { createClient } from '../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { resolveModuleCompletionMap } from '../../../lib/moduleCompletion';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal mock Request with a JSON body. */
function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/student/assessment/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a chainable Supabase admin mock whose final `.maybeSingle()` / `.insert()` /
 *  chained query returns the supplied value. */
function makeChain(resolveWith: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const terminal = vi.fn().mockResolvedValue(resolveWith);
  // Every Supabase builder method returns `chain` so they can be chained freely.
  for (const method of [
    'select', 'eq', 'in', 'not', 'order', 'limit', 'gt', 'insert', 'maybeSingle',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // Override the terminal calls that actually resolve the promise.
  (chain as any).maybeSingle = terminal;
  (chain as any).insert = vi.fn().mockResolvedValue(resolveWith);
  return chain;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/student/assessment/submit', () => {
  let mockSupabaseClient: { auth: { getUser: ReturnType<typeof vi.fn> } };
  let mockAdminClient: { from: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated as 'student-1'
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'student-1',
              user_metadata: { full_name: 'Test Student' },
            },
          },
          error: null,
        }),
      },
    };

    mockAdminClient = { from: vi.fn() };

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabaseClient);
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: Attempt limit enforcement (Req 5.1, 5.4 — Property 8)
  // ─────────────────────────────────────────────────────────────────────────
  it('returns 400 and does NOT insert when student already has 2 attempts', async () => {
    const insertMock = vi.fn();

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'module_assessments') {
        // Return a valid assessment record
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 1, module_id: 10, title: 'Tryout Test', created_at: '2025-01-01' },
            error: null,
          }),
        };
      }

      if (table === 'student_modules') {
        // Student is enrolled
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { student_id: 'student-1' },
            error: null,
          }),
        };
      }

      if (table === 'module_assessment_attempts') {
        // 2 existing attempts — at the limit
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 101, attempt_number: 1, score: 70, best_score: 70 },
              { id: 102, attempt_number: 2, score: 80, best_score: 80 },
            ],
            error: null,
          }),
          insert: insertMock,
        };
      }

      // Fallback — should not be reached in this test
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: insertMock,
      };
    });

    // Module 10 is complete
    (resolveModuleCompletionMap as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Map([[10, { moduleId: 10, isComplete: true, publishedTopicCount: 5, completedTopicCount: 5 }]])
    );

    const { POST } = await import('../student/assessment/submit/route');
    const response = await POST(makeRequest({ assessmentId: 1, answers: { '1': 'A' } }));

    // Must reject with 400
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect((body.error as string).toLowerCase()).toMatch(/batas|percobaan|limit/i);

    // The insert function must NOT have been called
    expect(insertMock).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2: Valid first submission returns 200 with AssessmentSubmitResult shape
  // (Req 4.3, 9.1)
  // ─────────────────────────────────────────────────────────────────────────
  it('returns 200 with AssessmentSubmitResult on a valid first submission', async () => {
    const questions = [
      {
        id: 10,
        assessment_id: 1,
        question_text: 'What is 2+2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_option: 'B',
        order_index: 0,
        created_at: '2025-01-01',
      },
      {
        id: 11,
        assessment_id: 1,
        question_text: 'Capital of France?',
        option_a: 'Berlin',
        option_b: 'Madrid',
        option_c: 'Paris',
        option_d: 'Rome',
        correct_option: 'C',
        order_index: 1,
        created_at: '2025-01-01',
      },
    ];

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'module_assessments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 1, module_id: 10, title: 'Tryout Test', created_at: '2025-01-01' },
            error: null,
          }),
        };
      }

      if (table === 'student_modules') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { student_id: 'student-1' },
            error: null,
          }),
        };
      }

      if (table === 'module_assessment_attempts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          // 0 existing attempts
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          // Insert succeeds
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }

      if (table === 'module_assessment_questions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: questions, error: null }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    (resolveModuleCompletionMap as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Map([[10, { moduleId: 10, isComplete: true, publishedTopicCount: 5, completedTopicCount: 5 }]])
    );

    const { POST } = await import('../student/assessment/submit/route');

    // Answer both questions: Q10 → correct (B), Q11 → correct (C)
    const response = await POST(makeRequest({ assessmentId: 1, answers: { '10': 'B', '11': 'C' } }));

    expect(response.status).toBe(200);

    const body = await response.json();

    // Shape assertions — matches AssessmentSubmitResult
    expect(body).toHaveProperty('score');
    expect(body).toHaveProperty('best_score');
    expect(body).toHaveProperty('attempt_number');
    expect(body).toHaveProperty('total_questions');
    expect(body).toHaveProperty('correct_count');
    expect(body).toHaveProperty('question_results');

    // First attempt
    expect(body.attempt_number).toBe(1);

    // 2 correct out of 2 → score 100
    expect(body.score).toBe(100);
    expect(body.best_score).toBe(100);
    expect(body.total_questions).toBe(2);
    expect(body.correct_count).toBe(2);

    // question_results array
    expect(Array.isArray(body.question_results)).toBe(true);
    expect(body.question_results).toHaveLength(2);
    body.question_results.forEach((qr: Record<string, unknown>) => {
      expect(qr).toHaveProperty('question_id');
      expect(qr).toHaveProperty('question_text');
      expect(qr).toHaveProperty('selected_option');
      expect(qr).toHaveProperty('correct_option');
      expect(qr).toHaveProperty('is_correct');
      expect(qr.is_correct).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 3: Missing answer for one question → 400 (Req 4.2)
  // ─────────────────────────────────────────────────────────────────────────
  it('returns 400 when at least one question is not answered', async () => {
    const questions = [
      {
        id: 20,
        assessment_id: 2,
        question_text: 'Q1',
        option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
        correct_option: 'A',
        order_index: 0,
        created_at: '2025-01-01',
      },
      {
        id: 21,
        assessment_id: 2,
        question_text: 'Q2',
        option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
        correct_option: 'B',
        order_index: 1,
        created_at: '2025-01-01',
      },
      {
        id: 22,
        assessment_id: 2,
        question_text: 'Q3',
        option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
        correct_option: 'C',
        order_index: 2,
        created_at: '2025-01-01',
      },
    ];

    const insertMock = vi.fn();

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'module_assessments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 2, module_id: 20, title: 'Another Tryout', created_at: '2025-01-01' },
            error: null,
          }),
        };
      }

      if (table === 'student_modules') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { student_id: 'student-1' },
            error: null,
          }),
        };
      }

      if (table === 'module_assessment_attempts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: insertMock,
        };
      }

      if (table === 'module_assessment_questions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: questions, error: null }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: insertMock,
      };
    });

    (resolveModuleCompletionMap as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Map([[20, { moduleId: 20, isComplete: true, publishedTopicCount: 3, completedTopicCount: 3 }]])
    );

    const { POST } = await import('../student/assessment/submit/route');

    // Only 2 of the 3 questions answered (Q3 with id 22 is missing)
    const response = await POST(makeRequest({ assessmentId: 2, answers: { '20': 'A', '21': 'B' } }));

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
    // Insert should NOT have been called
    expect(insertMock).not.toHaveBeenCalled();
  });
});
