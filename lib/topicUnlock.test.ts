import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from './supabaseAdmin';
import { resolveTopicUnlockMap } from './topicUnlock';

function makeAdminClient() {
  const topics = [
    {
      id: 101,
      module_id: 7,
      order_index: 1,
      engine_topic_id: 'beginner-tinkercad-01',
      status: 'published',
    },
    {
      id: 102,
      module_id: 7,
      order_index: 2,
      engine_topic_id: 'beginner-tinkercad-02',
      status: 'published',
    },
  ];

  const topicsQuery = {
    select: vi.fn(() => topicsQuery),
    in: vi.fn(() => topicsQuery),
    order: vi.fn(() => topicsQuery),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: topics, error: null }).then(resolve),
  };
  const meetingsQuery = {
    select: vi.fn(() => meetingsQuery),
    eq: vi.fn(() => meetingsQuery),
    order: vi.fn(() => meetingsQuery),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  };
  const progressQuery = {
    select: vi.fn(() => progressQuery),
    eq: vi.fn(() => progressQuery),
    in: vi.fn(() => progressQuery),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  };
  const quizQuery = {
    select: vi.fn(() => quizQuery),
    eq: vi.fn(() => quizQuery),
    not: vi.fn(() => quizQuery),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'topics') return topicsQuery;
      if (table === 'meetings') return meetingsQuery;
      if (table === 'topic_progress') return progressQuery;
      return quizQuery;
    }),
  };

  return client;
}

describe('resolveTopicUnlockMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unlocks the first published topic for an assigned module', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeAdminClient() as never);

    const unlocks = await resolveTopicUnlockMap('student-1', [7]);

    expect(unlocks.get(101)?.isUnlocked).toBe(true);
    expect(unlocks.get(102)?.isUnlocked).toBe(false);
  });
});