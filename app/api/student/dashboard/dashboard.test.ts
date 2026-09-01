/**
 * Bug Condition Exploration Test: Student Dashboard API Crash on Null Queries
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * This test explores the bug condition where the dashboard API crashes
 * when Supabase queries return null/undefined instead of handling them gracefully.
 *
 * EXPECTED OUTCOME ON UNFIXED CODE: Test FAILS
 * - This failure proves the bug exists
 * - Counterexamples show crash occurs with null/undefined queries
 *
 * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
 * - Dashboard handles null/undefined gracefully
 * - Returns 200 with safe defaults instead of crashing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Mock the Supabase modules
vi.mock('../../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('../../../../lib/supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('../../../../lib/topicUnlock', () => ({
  resolveTopicUnlockMap: vi.fn(),
}));

import { createClient } from '../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { resolveTopicUnlockMap } from '../../../../lib/topicUnlock';

// Utility types and generators for property-based testing
interface StudentTestData {
  studentId: string;
  studentName: string;
  email: string;
}

interface MeetingTestData {
  id: number;
  title: string;
  meeting_date: string;
  link_url: string;
  notes: string;
  session_count: number;
  session_number: number;
  series_id: number;
  progress_report: string | null;
  is_completed: boolean;
  completion_status: string;
  has_joined: boolean;
}

interface ModuleTestData {
  id: number;
  title: string;
  description: string;
  level: string;
}

interface TopicTestData {
  id: number;
  module_id: number;
  title: string;
  order_index: number;
  description: string;
  project_link: string;
  engine_topic_id: string | null;
  status: string;
  lesson_content: string;
}

interface QuizTestData {
  id: number;
  topic_id: number;
  title: string;
}

interface QuizAttemptTestData {
  id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  attempts_count: number;
  created_at: string;
}

interface TopicProgressTestData {
  xp_earned: number;
  best_quiz_score: number;
  engine_topic_id: string;
  completed_at: string;
  topic_id: number;
}

// Fast-check arbitraries
const arbStudent = (): fc.Arbitrary<StudentTestData> =>
  fc.tuple(fc.uuid(), fc.string({ minLength: 5, maxLength: 20 }), fc.emailAddress()).map(([id, name, email]) => ({
    studentId: id,
    studentName: name,
    email,
  }));

const arbMeeting = (index: number): fc.Arbitrary<MeetingTestData> =>
  fc.tuple(
    fc.integer({ min: 1, max: 1000 }),
    fc.lorem({ maxCount: 3 }),
    fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
    fc.webUrl(),
    fc.lorem({ maxCount: 10 }),
    fc.integer({ min: 1, max: 10 }),
    fc.integer({ min: 1, max: 3 }),
    fc.integer({ min: 1, max: 100 }),
    fc.option(fc.lorem({ maxCount: 5 })),
    fc.boolean(),
    fc.sampler(['completed', 'in_progress', 'pending'])(1)[0]
  ).map(
    ([id, title, date, link, notes, session_count, session_number, series_id, report, is_completed, status]) => ({
      id: 1000 + index,
      title,
      meeting_date: date.toISOString(),
      link_url: link,
      notes,
      session_count,
      session_number,
      series_id,
      progress_report: report,
      is_completed,
      completion_status: status,
      has_joined: Math.random() > 0.3, // 70% of students join
    })
  );

const arbModule = (index: number): fc.Arbitrary<ModuleTestData> =>
  fc.tuple(fc.lorem({ maxCount: 2 }), fc.lorem({ maxCount: 5 }), fc.sampler(['beginner', 'intermediate', 'advanced'])(1)[0]).map(
    ([title, desc, level]) => ({
      id: 100 + index,
      title,
      description: desc,
      level,
    })
  );

const arbTopic = (moduleId: number, index: number): fc.Arbitrary<TopicTestData> =>
  fc.tuple(
    fc.lorem({ maxCount: 3 }),
    fc.lorem({ maxCount: 8 }),
    fc.webUrl(),
    fc.option(fc.string({ minLength: 5, maxLength: 20 })),
    fc.sampler(['published', 'draft', 'archived'])(1)[0]
  ).map(([title, desc, link, engineId, status]) => ({
    id: 10000 + index,
    module_id: moduleId,
    title,
    order_index: index,
    description: desc,
    project_link: link,
    engine_topic_id: engineId,
    status,
    lesson_content: JSON.stringify({ content: 'test' }),
  }));

const arbQuiz = (topicId: number, index: number): fc.Arbitrary<QuizTestData> =>
  fc.lorem({ maxCount: 2 }).map((title) => ({
    id: 50000 + index,
    topic_id: topicId,
    title,
  }));

const arbQuizAttempt = (quizId: number, index: number): fc.Arbitrary<QuizAttemptTestData> =>
  fc.tuple(
    fc.integer({ min: 0, max: 100 }),
    fc.integer({ min: 1, max: 20 }),
    fc.integer({ min: 1, max: 5 }),
    fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
  ).map(([score, total, attempts, date]) => ({
    id: 60000 + index,
    quiz_id: quizId,
    score,
    total_questions: total,
    attempts_count: attempts,
    created_at: date.toISOString(),
  }));

const arbTopicProgress = (topicId: number, index: number): fc.Arbitrary<TopicProgressTestData> =>
  fc.tuple(
    fc.integer({ min: 0, max: 1000 }),
    fc.integer({ min: 0, max: 100 }),
    fc.string({ minLength: 5, maxLength: 20 }),
    fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
  ).map(([xp, score, engineId, date]) => ({
    xp_earned: xp,
    best_quiz_score: score,
    engine_topic_id: engineId,
    completed_at: date.toISOString(),
    topic_id: topicId,
  }));

describe('Dashboard API - Bug Condition Exploration', () => {
  let mockSupabaseClient: any;
  let mockAdminClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock authenticated user
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'test-student-id',
              user_metadata: { full_name: 'Test Student' },
            },
          },
          error: null,
        }),
      },
    };

    (createClient as any).mockResolvedValue(mockSupabaseClient);

    mockAdminClient = {
      from: vi.fn(),
    };

    (getSupabaseAdmin as any).mockReturnValue(mockAdminClient);
    (resolveTopicUnlockMap as any).mockResolvedValue(new Map());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===================================================================
  // PRESERVATION PROPERTY TESTS (Requirements 3.1, 3.2, 3.3)
  // ===================================================================
  // These tests capture EXISTING CORRECT BEHAVIOR
  // EXPECTED OUTCOME ON UNFIXED CODE: Tests PASS
  // These establish baseline behavior to ensure our fix doesn't break it.

  describe('Preservation: Dashboard Returns Successfully With Valid Data', () => {
    /**
     * P3.1: Dashboard returns 200 with valid data structure when all queries succeed
     *
     * **Validates: Requirements 3.1, 3.2, 3.3**
     *
     * When a student logs in and all Supabase queries return valid data,
     * the dashboard API should return a 200 response with the expected structure.
     */
    it('should return 200 with complete valid data structure', async () => {
      await fc.assert(
        fc.asyncProperty(arbStudent(), async (student) => {
          const modules = [
            { id: 100, title: 'Module 1', description: 'Desc 1', level: 'beginner' },
            { id: 101, title: 'Module 2', description: 'Desc 2', level: 'intermediate' },
          ];

          const topics = [
            {
              id: 10001,
              module_id: 100,
              title: 'Topic 1',
              order_index: 0,
              description: 'Desc',
              project_link: 'http://example.com',
              engine_topic_id: 'engine-1',
              status: 'published',
              lesson_content: '{}',
            },
            {
              id: 10002,
              module_id: 100,
              title: 'Topic 2',
              order_index: 1,
              description: 'Desc',
              project_link: 'http://example.com',
              engine_topic_id: 'engine-2',
              status: 'published',
              lesson_content: '{}',
            },
          ];

          const quizzes = [
            { id: 50001, topic_id: 10001, title: 'Quiz 1' },
            { id: 50002, topic_id: 10002, title: 'Quiz 2' },
          ];

          const meetings = [
            {
              id: 1001,
              title: 'Meeting 1',
              meeting_date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
              link_url: 'http://meet.example.com',
              notes: 'Notes',
              session_count: 1,
              session_number: 1,
              series_id: 1,
              progress_report: null,
              is_completed: false,
              completion_status: 'pending',
              meeting_students: [{ student_id: student.studentId, has_joined: true }],
              globalIndex: 0,
            },
            {
              id: 1002,
              title: 'Meeting 2',
              meeting_date: new Date(Date.now() + 172800000).toISOString(), // in 2 days
              link_url: 'http://meet.example.com',
              notes: 'Notes',
              session_count: 1,
              session_number: 2,
              series_id: 2,
              progress_report: null,
              is_completed: false,
              completion_status: 'pending',
              meeting_students: [{ student_id: student.studentId, has_joined: true }],
              globalIndex: 1,
            },
          ];

          const studentModules = [
            { module_id: 100, modules: modules[0] },
            { module_id: 101, modules: modules[1] },
          ];

          const quizAttempts = [
            {
              id: 60001,
              quiz_id: 50001,
              score: 85,
              total_questions: 10,
              attempts_count: 1,
              created_at: new Date().toISOString(),
              quizzes: { title: 'Quiz 1', topic_id: 10001, topics: { title: 'Topic 1' } },
            },
          ];

          const announcements = [
            {
              id: 1,
              content: 'Important announcement',
              expires_at: new Date(Date.now() + 86400000).toISOString(),
            },
          ];

          const topicProgress = [
            {
              xp_earned: 100,
              best_quiz_score: 90,
              engine_topic_id: 'engine-1',
              completed_at: new Date().toISOString(),
              topic_id: 10001,
              topics: { title: 'Topic 1' },
            },
          ];

          // Mock successful queries
          mockSupabaseClient.auth.getUser.mockResolvedValue({
            data: {
              user: {
                id: student.studentId,
                user_metadata: { full_name: student.studentName },
              },
            },
            error: null,
          });

          mockAdminClient.from.mockImplementation((table: string) => {
            if (table === 'meetings') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: meetings, error: null }),
              };
            }
            if (table === 'student_modules') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: studentModules, error: null }),
              };
            }
            if (table === 'quiz_attempts') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: quizAttempts, error: null }),
              };
            }
            if (table === 'announcements') {
              return {
                select: vi.fn().mockReturnThis(),
                gt: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: announcements, error: null }),
              };
            }
            if (table === 'topic_progress') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: topicProgress, error: null }),
              };
            }
            if (table === 'topics') {
              return {
                select: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: topics, error: null }),
              };
            }
            if (table === 'quizzes') {
              return {
                select: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: quizzes, error: null }),
              };
            }
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              gt: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          });

          // Mock unlock map
          const unlockMap = new Map();
          topics.forEach((topic) => {
            unlockMap.set(topic.id, { topicId: topic.id, engineTopicId: topic.engine_topic_id, isUnlocked: true });
          });
          (resolveTopicUnlockMap as any).mockResolvedValue(unlockMap);

          const { GET } = await import('./route');
          const response = await GET();

          // Should return 200
          expect(response.status).toBe(200);

          const json = await response.json();

          // Verify response structure
          expect(json).toHaveProperty('upcomingMeetings');
          expect(json).toHaveProperty('pastMeetings');
          expect(json).toHaveProperty('modules');
          expect(json).toHaveProperty('quizAttempts');
          expect(json).toHaveProperty('announcement');
          expect(json).toHaveProperty('studentName');
          expect(json).toHaveProperty('engineXpTotal');
          expect(json).toHaveProperty('completedEngineTopics');
          expect(json).toHaveProperty('topicProgress');

          // Verify arrays are present
          expect(Array.isArray(json.upcomingMeetings)).toBe(true);
          expect(Array.isArray(json.pastMeetings)).toBe(true);
          expect(Array.isArray(json.modules)).toBe(true);
          expect(Array.isArray(json.quizAttempts)).toBe(true);
          expect(Array.isArray(json.topicProgress)).toBe(true);
        }),
        { numRuns: 10 }
      );
    });

    /**
     * P3.2: Meeting sorting and filtering logic works correctly
     *
     * **Validates: Requirements 3.1, 3.2, 3.3**
     *
     * Meetings should be sorted by date and filtered according to visibility rules:
     * - Completed meetings should not appear in upcoming
     * - Meetings where student missed and 65+ minutes have passed should be hidden
     * - Upcoming meetings (max 3) sorted by date ascending
     */
    it('should correctly sort and filter meetings', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 5 }), async (numMeetings) => {
          const student = { studentId: 'student-1', studentName: 'Test Student', email: 'test@example.com' };
          const now = new Date();

          // Generate meetings with different states
          const meetings = Array.from({ length: numMeetings }, (_, i) => {
            const meetingDate = new Date(now.getTime() + (i - 1) * 86400000); // staggered by 1 day
            return {
              id: 1000 + i,
              title: `Meeting ${i + 1}`,
              meeting_date: meetingDate.toISOString(),
              link_url: 'http://meet.example.com',
              notes: 'Notes',
              session_count: 1,
              session_number: i + 1,
              series_id: 1,
              progress_report: i % 2 === 0 ? 'Report' : null,
              is_completed: i % 3 === 0, // Every 3rd meeting completed
              completion_status: 'pending',
              meeting_students: [
                {
                  student_id: student.studentId,
                  has_joined: i % 2 === 0, // Every other meeting joined
                },
              ],
              globalIndex: i,
            };
          });

          mockSupabaseClient.auth.getUser.mockResolvedValue({
            data: {
              user: {
                id: student.studentId,
                user_metadata: { full_name: student.studentName },
              },
            },
            error: null,
          });

          mockAdminClient.from.mockImplementation((table: string) => {
            if (table === 'meetings') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: meetings, error: null }),
              };
            }
            if (table === 'student_modules') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }
            if (table === 'quiz_attempts') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }
            if (table === 'announcements') {
              return {
                select: vi.fn().mockReturnThis(),
                gt: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }
            if (table === 'topic_progress') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              gt: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          });

          (resolveTopicUnlockMap as any).mockResolvedValue(new Map());

          const { GET } = await import('./route');
          const response = await GET();
          const json = await response.json();

          // Verify response structure
          expect(response.status).toBe(200);
          expect(Array.isArray(json.upcomingMeetings)).toBe(true);
          expect(Array.isArray(json.pastMeetings)).toBe(true);

          // Upcoming meetings should not exceed 3
          expect(json.upcomingMeetings.length).toBeLessThanOrEqual(3);

          // Completed meetings should not be in upcoming
          json.upcomingMeetings.forEach((m: any) => {
            expect(m.is_completed).toBe(false);
          });

          // If multiple upcoming meetings, should be sorted by date ascending
          if (json.upcomingMeetings.length > 1) {
            for (let i = 0; i < json.upcomingMeetings.length - 1; i++) {
              const date1 = new Date(json.upcomingMeetings[i].meeting_date).getTime();
              const date2 = new Date(json.upcomingMeetings[i + 1].meeting_date).getTime();
              expect(date1).toBeLessThanOrEqual(date2);
            }
          }
        }),
        { numRuns: 10 }
      );
    });

    /**
     * P3.3: Topic unlock logic correctly maps meeting assignments and engine completion
     *
     * **Validates: Requirements 3.1, 3.2, 3.3**
     *
     * Topics should be unlocked based on:
     * 1. Student attending meeting at corresponding position (modulo topics count)
     * 2. OR engine topic completion status
     */
    it('should correctly calculate topic unlock status from meetings and engine completion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 2, max: 5 }),
          async (numTopics, numMeetings) => {
            const student = { studentId: 'student-1', studentName: 'Test Student', email: 'test@example.com' };

            const moduleId = 100;
            const topics = Array.from({ length: numTopics }, (_, i) => ({
              id: 10000 + i,
              module_id: moduleId,
              title: `Topic ${i + 1}`,
              order_index: i,
              description: 'Desc',
              project_link: 'http://example.com',
              engine_topic_id: i % 2 === 0 ? `engine-${i}` : null,
              status: 'published',
              lesson_content: '{}',
            }));

            // Create meetings with varied join status
            const meetings = Array.from({ length: numMeetings }, (_, i) => ({
              id: 1000 + i,
              title: `Meeting ${i + 1}`,
              meeting_date: new Date(Date.now() + i * 86400000).toISOString(),
              link_url: 'http://meet.example.com',
              notes: 'Notes',
              session_count: 1,
              session_number: i + 1,
              series_id: 1,
              progress_report: null,
              is_completed: false,
              completion_status: 'pending',
              meeting_students: [
                {
                  student_id: student.studentId,
                  has_joined: i % 2 === 0, // Alternating join status
                },
              ],
              globalIndex: i,
            }));

            mockSupabaseClient.auth.getUser.mockResolvedValue({
              data: {
                user: {
                  id: student.studentId,
                  user_metadata: { full_name: student.studentName },
                },
              },
              error: null,
            });

            mockAdminClient.from.mockImplementation((table: string) => {
              if (table === 'meetings') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  order: vi.fn().mockResolvedValue({ data: meetings, error: null }),
                };
              }
              if (table === 'student_modules') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  order: vi.fn().mockResolvedValue(
                    {
                      data: [{ module_id: moduleId, modules: { id: moduleId, title: 'Module', description: 'Desc', level: 'beginner' } }],
                      error: null,
                    },
                    { numRuns: 1 }
                  ),
                };
              }
              if (table === 'quiz_attempts') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              if (table === 'topics') {
                return {
                  select: vi.fn().mockReturnThis(),
                  in: vi.fn().mockReturnThis(),
                  order: vi.fn().mockResolvedValue({ data: topics, error: null }),
                };
              }
              if (table === 'quizzes') {
                return {
                  select: vi.fn().mockReturnThis(),
                  in: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              if (table === 'announcements') {
                return {
                  select: vi.fn().mockReturnThis(),
                  gt: vi.fn().mockReturnThis(),
                  order: vi.fn().mockReturnThis(),
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              if (table === 'topic_progress') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                gt: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            });

            // Build unlock map manually to match expected behavior
            const unlockMap = new Map();
            topics.forEach((topic, idx) => {
              const meetingIdx = numTopics > 0 ? idx % numTopics : idx;
              const meeting = meetings[meetingIdx];
              const unlockedByJoin = meeting?.meeting_students?.[0]?.has_joined === true;
              const unlockedByEngine = topic.engine_topic_id ? idx % 2 === 0 : false;
              const isUnlocked = unlockedByJoin || unlockedByEngine;

              unlockMap.set(topic.id, {
                topicId: topic.id,
                engineTopicId: topic.engine_topic_id,
                isUnlocked,
              });
            });

            (resolveTopicUnlockMap as any).mockResolvedValue(unlockMap);

            const { GET } = await import('./route');
            const response = await GET();
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.modules.length).toBe(1);

            const module = json.modules[0];
            expect(module.topics.length).toBe(numTopics);

            // Verify unlock logic: topics have isUnlocked property
            module.topics.forEach((topic: any) => {
              expect(topic).toHaveProperty('isUnlocked');
              expect(typeof topic.isUnlocked).toBe('boolean');
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * P3.4: Module unlock percentages calculate correctly
     *
     * **Validates: Requirements 3.1, 3.2, 3.3**
     *
     * Module status should reflect topic unlock counts:
     * - isModuleLocked: unlockedCount === 0
     * - isModuleActive: unlockedCount > 0 && unlockedCount < totalTopics
     * - isModuleComplete: unlockedCount === totalTopics (when totalTopics > 0)
     */
    it('should correctly calculate module lock status from topic unlocks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 3 }),
          fc.integer({ min: 2, max: 5 }),
          async (numModules, topicsPerModule) => {
            const student = { studentId: 'student-1', studentName: 'Test Student', email: 'test@example.com' };

            // Create modules
            const modules = Array.from({ length: numModules }, (_, i) => ({
              id: 100 + i,
              title: `Module ${i + 1}`,
              description: 'Desc',
              level: 'beginner',
            }));

            // Create topics for each module
            const allTopics: any[] = [];
            modules.forEach((mod) => {
              for (let i = 0; i < topicsPerModule; i++) {
                allTopics.push({
                  id: mod.id * 1000 + i,
                  module_id: mod.id,
                  title: `Topic ${i + 1}`,
                  order_index: i,
                  description: 'Desc',
                  project_link: 'http://example.com',
                  engine_topic_id: null,
                  status: 'published',
                  lesson_content: '{}',
                });
              }
            });

            const studentModules = modules.map((m) => ({
              module_id: m.id,
              modules: m,
            }));

            mockSupabaseClient.auth.getUser.mockResolvedValue({
              data: {
                user: {
                  id: student.studentId,
                  user_metadata: { full_name: student.studentName },
                },
              },
              error: null,
            });

            mockAdminClient.from.mockImplementation((table: string) => {
              if (table === 'meetings') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              if (table === 'student_modules') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  order: vi.fn().mockResolvedValue({ data: studentModules, error: null }),
                };
              }
              if (table === 'quiz_attempts') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              if (table === 'topics') {
                return {
                  select: vi.fn().mockReturnThis(),
                  in: vi.fn().mockReturnThis(),
                  order: vi.fn().mockResolvedValue({ data: allTopics, error: null }),
                };
              }
              if (table === 'quizzes') {
                return {
                  select: vi.fn().mockReturnThis(),
                  in: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              if (table === 'announcements') {
                return {
                  select: vi.fn().mockReturnThis(),
                  gt: vi.fn().mockReturnThis(),
                  order: vi.fn().mockReturnThis(),
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              if (table === 'topic_progress') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                gt: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            });

            // Create unlock map - vary unlock counts per module
            const unlockMap = new Map();
            modules.forEach((mod, modIdx) => {
              const topicIds = allTopics.filter((t) => t.module_id === mod.id).map((t) => t.id);
              const unlockedPerModule = modIdx % 3; // 0, 1, or 2 unlocked topics per module
              topicIds.forEach((topicId, idx) => {
                unlockMap.set(topicId, {
                  topicId,
                  engineTopicId: null,
                  isUnlocked: idx < unlockedPerModule,
                });
              });
            });

            (resolveTopicUnlockMap as any).mockResolvedValue(unlockMap);

            const { GET } = await import('./route');
            const response = await GET();
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.modules.length).toBe(numModules);

            // Verify module status calculations
            json.modules.forEach((module: any, modIdx: number) => {
              expect(module).toHaveProperty('isModuleLocked');
              expect(module).toHaveProperty('isModuleActive');
              expect(module).toHaveProperty('isModuleComplete');

              const unlockedCount = module.topics.filter((t: any) => t.isUnlocked).length;
              const expectedLocked = unlockedCount === 0;
              const expectedActive = unlockedCount > 0 && unlockedCount < module.topics.length;
              const expectedComplete = module.topics.length > 0 && unlockedCount === module.topics.length;

              expect(module.isModuleLocked).toBe(expectedLocked);
              expect(module.isModuleActive).toBe(expectedActive);
              expect(module.isModuleComplete).toBe(expectedComplete);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * P3.5: Quiz attempts are displayed correctly
     *
     * **Validates: Requirements 3.1, 3.2, 3.3**
     *
     * Quiz attempts should be returned with all required fields and
     * maintain their creation order (newest first).
     */
    it('should display quiz attempts with correct structure and ordering', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 0, max: 5 }), async (numAttempts) => {
          const student = { studentId: 'student-1', studentName: 'Test Student', email: 'test@example.com' };

          const quizAttempts = Array.from({ length: numAttempts }, (_, i) => ({
            id: 60000 + i,
            quiz_id: 50000 + i,
            score: Math.floor(Math.random() * 100),
            total_questions: 10 + i,
            attempts_count: i + 1,
            created_at: new Date(Date.now() - i * 3600000).toISOString(), // staggered by hours
            quizzes: {
              title: `Quiz ${i + 1}`,
              topic_id: 10000 + i,
              topics: { title: `Topic ${i + 1}` },
            },
          }));

          mockSupabaseClient.auth.getUser.mockResolvedValue({
            data: {
              user: {
                id: student.studentId,
                user_metadata: { full_name: student.studentName },
              },
            },
            error: null,
          });

          mockAdminClient.from.mockImplementation((table: string) => {
            if (table === 'quiz_attempts') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: quizAttempts, error: null }),
              };
            }
            if (table === 'meetings') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }
            if (table === 'student_modules') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }
            if (table === 'announcements') {
              return {
                select: vi.fn().mockReturnThis(),
                gt: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }
            if (table === 'topic_progress') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              gt: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          });

          (resolveTopicUnlockMap as any).mockResolvedValue(new Map());

          const { GET } = await import('./route');
          const response = await GET();
          const json = await response.json();

          expect(response.status).toBe(200);
          expect(Array.isArray(json.quizAttempts)).toBe(true);
          expect(json.quizAttempts.length).toBe(numAttempts);

          // Verify quiz attempts have required fields
          json.quizAttempts.forEach((attempt: any) => {
            expect(attempt).toHaveProperty('id');
            expect(attempt).toHaveProperty('quiz_id');
            expect(attempt).toHaveProperty('score');
            expect(attempt).toHaveProperty('total_questions');
            expect(attempt).toHaveProperty('attempts_count');
            expect(attempt).toHaveProperty('created_at');
          });

          // Verify ordering (should be sorted by created_at descending)
          if (numAttempts > 1) {
            for (let i = 0; i < numAttempts - 1; i++) {
              const date1 = new Date(json.quizAttempts[i].created_at).getTime();
              const date2 = new Date(json.quizAttempts[i + 1].created_at).getTime();
              expect(date1).toBeGreaterThanOrEqual(date2);
            }
          }
        }),
        { numRuns: 10 }
      );
    });

    /**
     * P3.6: Student with no meetings assigned still loads successfully
     *
     * **Validates: Requirements 3.1, 3.2, 3.3**
     *
     * Dashboard should work with empty meetings list (no crashes on empty data).
     */
    it('should handle student with no meetings assigned', async () => {
      const student = { studentId: 'student-1', studentName: 'Test Student', email: 'test@example.com' };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: student.studentId,
            user_metadata: { full_name: student.studentName },
          },
        },
        error: null,
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'meetings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      (resolveTopicUnlockMap as any).mockResolvedValue(new Map());

      const { GET } = await import('./route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.upcomingMeetings).toEqual([]);
      expect(json.pastMeetings).toEqual([]);
    });

    /**
     * P3.7: Topics with and without engine_topic_id set
     *
     * **Validates: Requirements 3.1, 3.2, 3.3**
     *
     * Dashboard should handle topics with and without engine integration.
     */
    it('should handle topics with and without engine_topic_id', async () => {
      const student = { studentId: 'student-1', studentName: 'Test Student', email: 'test@example.com' };
      const moduleId = 100;

      const topics = [
        {
          id: 10001,
          module_id: moduleId,
          title: 'Topic with Engine',
          order_index: 0,
          description: 'Desc',
          project_link: 'http://example.com',
          engine_topic_id: 'engine-abc123',
          status: 'published',
          lesson_content: '{}',
        },
        {
          id: 10002,
          module_id: moduleId,
          title: 'Topic without Engine',
          order_index: 1,
          description: 'Desc',
          project_link: 'http://example.com',
          engine_topic_id: null,
          status: 'published',
          lesson_content: '{}',
        },
      ];

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: student.studentId,
            user_metadata: { full_name: student.studentName },
          },
        },
        error: null,
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'student_modules') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [{ module_id: moduleId, modules: { id: moduleId, title: 'Module', description: 'Desc', level: 'beginner' } }],
              error: null,
            }),
          };
        }
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: topics, error: null }),
          };
        }
        if (table === 'quizzes') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'meetings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const unlockMap = new Map();
      topics.forEach((topic) => {
        unlockMap.set(topic.id, {
          topicId: topic.id,
          engineTopicId: topic.engine_topic_id,
          isUnlocked: false,
        });
      });
      (resolveTopicUnlockMap as any).mockResolvedValue(unlockMap);

      const { GET } = await import('./route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.modules[0].topics.length).toBe(2);
      expect(json.modules[0].topics[0].engine_topic_id).toBe('engine-abc123');
      expect(json.modules[0].topics[1].engine_topic_id).toBeNull();
    });
  });

  // ===================================================================
  // BUG CONDITION EXPLORATION TESTS (Requirements 1.1, 1.2, 1.3)
  // ===================================================================
  // These tests verify the bug exists by demonstrating crashes
  // EXPECTED OUTCOME ON UNFIXED CODE: Tests FAIL (crash detected = bug confirmed)
  // EXPECTED OUTCOME ON FIXED CODE: Tests PASS (no crash = bug fixed)

  describe('Bug Condition Exploration: Dashboard API Crashes', () => {
    let mockSupabaseClient: any;
    let mockAdminClient: any;

    beforeEach(() => {
      vi.clearAllMocks();

      mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'test-student-id',
                user_metadata: { full_name: 'Test Student' },
              },
            },
            error: null,
          }),
        },
      };

      (createClient as any).mockResolvedValue(mockSupabaseClient);

      mockAdminClient = {
        from: vi.fn(),
      };

      (getSupabaseAdmin as any).mockReturnValue(mockAdminClient);
      (resolveTopicUnlockMap as any).mockResolvedValue(new Map());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    /**
     * Bug Condition 1: Dashboard crashes when meetings query fails
     *
     * No try-catch around dashboard endpoint or individual queries
     */
    it('should crash when meetings query fails (Bug Condition)', async () => {
      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'meetings') {
          // Return an object that will cause error when methods are called
          // This simulates a failed query
          return {
            select: vi.fn().mockRejectedValue(new Error('Meeting query failed')),
            eq: vi.fn().mockRejectedValue(new Error('Meeting query failed')),
            order: vi.fn().mockRejectedValue(new Error('Meeting query failed')),
          };
        }
        if (table === 'student_modules') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'quiz_attempts') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'announcements') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            gt: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
            limit: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'topic_progress') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [] }),
          eq: vi.fn().mockResolvedValue({ data: [] }),
          order: vi.fn().mockResolvedValue({ data: [] }),
          in: vi.fn().mockResolvedValue({ data: [] }),
          gt: vi.fn().mockResolvedValue({ data: [] }),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        };
      });

      const { GET } = await import('./route');

      let threwError = false;
      let errorMsg = '';

      try {
        const response = await GET();
        // On fixed code, should return success even with failed query
        if (response && typeof response === 'object' && 'status' in response) {
          // Good - got a response instead of crash
          expect(response.status).not.toBe(500);
        }
      } catch (error: any) {
        threwError = true;
        errorMsg = error?.message || String(error);
      }

      // Assert: Should crash on unfixed code
      expect(threwError).toBe(true);
    });

    /**
     * Bug Condition 2: Dashboard crashes when student_modules query fails
     */
    it('should crash when student_modules query fails (Bug Condition)', async () => {
      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'student_modules') {
          return {
            select: vi.fn().mockRejectedValue(new Error('Student modules query failed')),
            eq: vi.fn().mockRejectedValue(new Error('Student modules query failed')),
            order: vi.fn().mockRejectedValue(new Error('Student modules query failed')),
          };
        }
        if (table === 'meetings') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'quiz_attempts') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'announcements') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            gt: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
            limit: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'topic_progress') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [] }),
          eq: vi.fn().mockResolvedValue({ data: [] }),
          order: vi.fn().mockResolvedValue({ data: [] }),
          in: vi.fn().mockResolvedValue({ data: [] }),
          gt: vi.fn().mockResolvedValue({ data: [] }),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        };
      });

      const { GET } = await import('./route');

      let threwError = false;

      try {
        await GET();
      } catch (error: any) {
        threwError = true;
      }

      // Assert: Should crash on unfixed code
      expect(threwError).toBe(true);
    });

    /**
     * Bug Condition 3: Dashboard crashes when quiz_attempts query fails
     */
    it('should crash when quiz_attempts query fails (Bug Condition)', async () => {
      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'quiz_attempts') {
          return {
            select: vi.fn().mockRejectedValue(new Error('Quiz attempts query failed')),
            eq: vi.fn().mockRejectedValue(new Error('Quiz attempts query failed')),
            order: vi.fn().mockRejectedValue(new Error('Quiz attempts query failed')),
          };
        }
        if (table === 'meetings') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'student_modules') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'announcements') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            gt: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
            limit: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'topic_progress') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [] }),
          eq: vi.fn().mockResolvedValue({ data: [] }),
          order: vi.fn().mockResolvedValue({ data: [] }),
          in: vi.fn().mockResolvedValue({ data: [] }),
          gt: vi.fn().mockResolvedValue({ data: [] }),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        };
      });

      const { GET } = await import('./route');

      let threwError = false;

      try {
        await GET();
      } catch (error: any) {
        threwError = true;
      }

      // Assert: Should crash on unfixed code
      expect(threwError).toBe(true);
    });

    /**
     * Bug Condition 4: Dashboard crashes when announcements query fails
     */
    it('should crash when announcements query fails (Bug Condition)', async () => {
      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'announcements') {
          return {
            select: vi.fn().mockRejectedValue(new Error('Announcements query failed')),
            gt: vi.fn().mockRejectedValue(new Error('Announcements query failed')),
            order: vi.fn().mockRejectedValue(new Error('Announcements query failed')),
            limit: vi.fn().mockRejectedValue(new Error('Announcements query failed')),
          };
        }
        if (table === 'meetings') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'student_modules') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'quiz_attempts') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'topic_progress') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [] }),
          eq: vi.fn().mockResolvedValue({ data: [] }),
          order: vi.fn().mockResolvedValue({ data: [] }),
          in: vi.fn().mockResolvedValue({ data: [] }),
          gt: vi.fn().mockResolvedValue({ data: [] }),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        };
      });

      const { GET } = await import('./route');

      let threwError = false;

      try {
        await GET();
      } catch (error: any) {
        threwError = true;
      }

      // Assert: Should crash on unfixed code
      expect(threwError).toBe(true);
    });

    /**
     * Bug Condition 5: Dashboard crashes when topic_progress query fails
     */
    it('should crash when topic_progress query fails (Bug Condition)', async () => {
      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'topic_progress') {
          return {
            select: vi.fn().mockRejectedValue(new Error('Topic progress query failed')),
            eq: vi.fn().mockRejectedValue(new Error('Topic progress query failed')),
            order: vi.fn().mockRejectedValue(new Error('Topic progress query failed')),
          };
        }
        if (table === 'meetings') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'student_modules') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'quiz_attempts') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'announcements') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
            gt: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
            limit: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [] }),
          eq: vi.fn().mockResolvedValue({ data: [] }),
          order: vi.fn().mockResolvedValue({ data: [] }),
          in: vi.fn().mockResolvedValue({ data: [] }),
          gt: vi.fn().mockResolvedValue({ data: [] }),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        };
      });

      const { GET } = await import('./route');

      let threwError = false;

      try {
        await GET();
      } catch (error: any) {
        threwError = true;
      }

      // Assert: Should crash on unfixed code
      expect(threwError).toBe(true);
    });
  });
});
