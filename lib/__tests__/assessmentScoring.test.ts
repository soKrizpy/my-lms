import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  computeScore,
  computeBestScore,
  buildQuestionResults,
} from '../../lib/assessmentScoring';

// Validates: Requirements 4.3, 4.4, 4.6

describe('assessmentScoring', () => {
  /**
   * Property 5: Score computation correctness
   * For any (correct, total) where 0 ≤ correct ≤ total and total ≥ 1,
   * computeScore must equal Math.round((correct/total)*100) and fall in [0,100].
   */
  it('Property 5: score is always ROUND((correct/total)*100) in [0,100]', () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 1, max: 20 })
          .chain((total) =>
            fc
              .integer({ min: 0, max: total })
              .map((correct) => ({ correct, total }))
          ),
        ({ correct, total }) => {
          const result = computeScore(correct, total);
          expect(result).toBe(Math.round((correct / total) * 100));
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Best score is the running maximum
   * For any two scores s1, s2 in [0,100],
   * computeBestScore(s1, s2) must equal Math.max(s1, s2).
   */
  it('Property 6: computeBestScore returns the maximum of two scores', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (s1, s2) => {
          expect(computeBestScore(s1, s2)).toBe(Math.max(s1, s2));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Question results reflect correctness accurately
   * For any answers map and questions array,
   * every item in buildQuestionResults(answers, questions) must have:
   *   - is_correct === (selected_option === correct_option)
   *   - correct_option field present on items where is_correct === false
   */
  it('Property 7: buildQuestionResults reflects correctness accurately', () => {
    const optionArb = fc.constantFrom('A', 'B', 'C', 'D') as fc.Arbitrary<
      'A' | 'B' | 'C' | 'D'
    >;

    const questionsArb = fc
      .integer({ min: 1, max: 20 })
      .chain((count) =>
        fc.uniqueArray(fc.integer({ min: 1, max: 1000 }), {
          minLength: count,
          maxLength: count,
        }).chain((ids) =>
          fc
            .array(
              fc.record({
                correct_option: optionArb,
                question_text: fc.string({ minLength: 1, maxLength: 50 }),
              }),
              { minLength: count, maxLength: count }
            )
            .map((fields) =>
              ids.map((id, i) => ({
                id,
                question_text: fields[i].question_text,
                correct_option: fields[i].correct_option,
              }))
            )
        )
      );

    fc.assert(
      fc.property(questionsArb, (questions) => {
        // Build answers map: each question gets an arbitrary option
        // We derive answers inline so we can test both correct and incorrect cases
        const answersArb = fc.record(
          Object.fromEntries(
            questions.map((q) => [String(q.id), optionArb])
          ) as Record<string, fc.Arbitrary<'A' | 'B' | 'C' | 'D'>>
        ) as fc.Arbitrary<Record<string, 'A' | 'B' | 'C' | 'D'>>;

        fc.assert(
          fc.property(answersArb, (answers) => {
            const results = buildQuestionResults(answers, questions);

            expect(results).toHaveLength(questions.length);

            results.forEach((item, i) => {
              const q = questions[i];
              const selected = answers[String(q.id)];
              const expected_correct = selected === q.correct_option;

              // is_correct must match the actual comparison
              expect(item.is_correct).toBe(expected_correct);

              // correct_option field must always be present (needed when is_correct === false)
              expect(item.correct_option).toBe(q.correct_option);

              // When wrong, correct_option is the correct answer
              if (!item.is_correct) {
                expect(item.correct_option).toBeDefined();
                expect(['A', 'B', 'C', 'D']).toContain(item.correct_option);
              }
            });
          }),
          { numRuns: 10 } // inner loop: 10 answer variations × 100 outer = 1000 checks
        );
      }),
      { numRuns: 100 }
    );
  });
});
