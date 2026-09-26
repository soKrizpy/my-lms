import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../lib/auth', () => ({
  requireAdmin: vi.fn(),
}));

import { requireAdmin } from '../../../../../lib/auth';
import { POST } from './route';

const studentId = '00000000-0000-4000-8000-000000000001';

function makeAdminClient() {
  const queries: Array<Record<string, any>> = [];
  const client = {
    from: vi.fn(() => {
      const query: Record<string, any> = {};
      for (const method of ['select', 'eq', 'delete']) {
        query[method] = vi.fn(() => query);
      }
      query.in = vi.fn().mockResolvedValue({ data: [], error: null });
      query.upsert = vi.fn().mockResolvedValue({ error: null });
      query.not = vi.fn().mockResolvedValue({ error: null });
      queries.push(query);
      return query;
    }),
  };

  return { client, queries };
}

function makeRequest(ids: string[]) {
  return new Request('http://localhost/api/modules/17/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentIds: ids }),
  });
}

describe('POST /api/modules/[moduleId]/assign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes UUIDs to the cleanup filter without adding quotes', async () => {
    const { client, queries } = makeAdminClient();
    vi.mocked(requireAdmin).mockResolvedValue({ adminClient: client } as never);

    const response = await POST(makeRequest([studentId]), {
      params: Promise.resolve({ moduleId: '17' }),
    });

    expect(response.status).toBe(200);
    expect(queries[3].not).toHaveBeenCalledWith(
      'student_id',
      'in',
      `(${studentId})`
    );
    expect(queries[3].not).not.toHaveBeenCalledWith(
      'student_id',
      'in',
      `('${studentId}')`
    );
  });

  it('rejects UUID values that include literal quote characters', async () => {
    const { client } = makeAdminClient();
    vi.mocked(requireAdmin).mockResolvedValue({ adminClient: client } as never);

    const response = await POST(makeRequest([`'${studentId}'`]), {
      params: Promise.resolve({ moduleId: '17' }),
    });

    expect(response.status).toBe(400);
    expect(client.from).not.toHaveBeenCalled();
  });
});
