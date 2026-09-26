import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../../lib/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('../../../../../../lib/ingestLesson', () => ({
  ensureQuizStub: vi.fn(),
}));

import { requireAdmin } from '../../../../../../lib/auth';
import { ensureQuizStub } from '../../../../../../lib/ingestLesson';
import { POST } from './route';

type TopicRow = {
  id: number;
  engine_topic_id: string;
  module_id: number;
  order_index: number;
};

function makeAdminClient(options?: {
  existingTopics?: TopicRow[];
  linkedTopics?: TopicRow[];
  failedInsertIds?: string[];
}) {
  const insertedTopics: Record<string, unknown>[] = [];
  let selectedRows: TopicRow[] = options?.existingTopics ?? [];
  let nextTopicId = 100;

  const insertQuery = {
    select: vi.fn(() => insertQuery),
    single: vi.fn(async () => {
      const insertedTopic = insertedTopics[insertedTopics.length - 1];
      const topicId = insertedTopic.engine_topic_id as string;

      if (options?.failedInsertIds?.includes(topicId)) {
        return { data: null, error: { message: 'insert failed' } };
      }

      return { data: { id: nextTopicId++ }, error: null };
    }),
  };

  const query: Record<string, any> = {
    select: vi.fn((columns: string) => {
      selectedRows = columns.includes('module_id')
        ? (options?.linkedTopics ?? [])
        : (options?.existingTopics ?? []);
      return query;
    }),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    insert: vi.fn((values: Record<string, unknown>) => {
      insertedTopics.push(values);
      return insertQuery;
    }),
    then: (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown
    ) =>
      Promise.resolve({ data: selectedRows, error: null }).then(
        resolve,
        reject
      ),
  };

  return {
    client: { from: vi.fn(() => query) },
    insertedTopics,
  };
}

function makeRequest(category: string) {
  return new Request(
    'http://localhost/api/admin/modules/1/seed-engine-topics',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    }
  );
}

async function seed(category: string) {
  return POST(makeRequest(category), { params: Promise.resolve({ id: '1' }) });
}

describe('POST /api/admin/modules/[id]/seed-engine-topics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureQuizStub).mockResolvedValue(500);
  });

  it('seeds the Tinkercad catalog category', async () => {
    const { client, insertedTopics } = makeAdminClient();
    vi.mocked(requireAdmin).mockResolvedValue({ adminClient: client } as never);

    const response = await seed('3D & AR');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.created).toBe(12);
    expect(insertedTopics).toHaveLength(12);
  });

  it('rejects categories that are not in the catalog', async () => {
    const { client, insertedTopics } = makeAdminClient();
    vi.mocked(requireAdmin).mockResolvedValue({ adminClient: client } as never);

    const response = await seed('not-a-category');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('No lessons found');
    expect(insertedTopics).toHaveLength(0);
  });

  it('skips topics already linked to the current module', async () => {
    const existingTopic = {
      id: 10,
      engine_topic_id: 'beginner-html-01',
      module_id: 1,
      order_index: 1,
    };
    const { client, insertedTopics } = makeAdminClient({
      existingTopics: [existingTopic],
      linkedTopics: [existingTopic],
    });
    vi.mocked(requireAdmin).mockResolvedValue({ adminClient: client } as never);

    const response = await seed('HTML');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.created).toBe(9);
    expect(body.skipped).toBe(1);
    expect(
      insertedTopics.some(
        (topic) => topic.engine_topic_id === 'beginner-html-01'
      )
    ).toBe(false);
  });

  it('reports topics already linked to a different module', async () => {
    const { client, insertedTopics } = makeAdminClient({
      linkedTopics: [
        {
          id: 10,
          engine_topic_id: 'beginner-html-01',
          module_id: 99,
          order_index: 1,
        },
      ],
    });
    vi.mocked(requireAdmin).mockResolvedValue({ adminClient: client } as never);

    const response = await seed('HTML');
    const body = await response.json();

    expect(response.status).toBe(207);
    expect(body.conflicts).toContainEqual(
      expect.objectContaining({
        lessonId: 'beginner-html-01',
        moduleId: 99,
      })
    );
    expect(
      insertedTopics.some(
        (topic) => topic.engine_topic_id === 'beginner-html-01'
      )
    ).toBe(false);
  });

  it('reports quiz-stub failures for existing topics', async () => {
    const existingTopic = {
      id: 10,
      engine_topic_id: 'beginner-html-01',
      module_id: 1,
      order_index: 1,
    };
    const { client } = makeAdminClient({
      existingTopics: [existingTopic],
      linkedTopics: [existingTopic],
    });
    vi.mocked(requireAdmin).mockResolvedValue({ adminClient: client } as never);
    vi.mocked(ensureQuizStub).mockResolvedValueOnce(null);

    const response = await seed('HTML');
    const body = await response.json();

    expect(response.status).toBe(207);
    expect(body.errors).toContainEqual(
      expect.objectContaining({
        lessonId: 'beginner-html-01',
        message: 'Could not ensure a quiz record for the existing topic.',
      })
    );
  });

  it('reports database insert failures instead of silently skipping them', async () => {
    const { client } = makeAdminClient({
      failedInsertIds: ['beginner-html-01'],
    });
    vi.mocked(requireAdmin).mockResolvedValue({ adminClient: client } as never);

    const response = await seed('HTML');
    const body = await response.json();

    expect(response.status).toBe(207);
    expect(body.errors).toContainEqual(
      expect.objectContaining({
        lessonId: 'beginner-html-01',
        message: 'insert failed',
      })
    );
    expect(body.created).toBe(9);
  });
});
