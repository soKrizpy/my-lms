import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('../../../../lib/supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { createClient } from '../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { PATCH } from './route';

describe('PATCH /api/student/profile', () => {
  let mockSupabase: any;
  let mockAdmin: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
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
    (createClient as any).mockResolvedValue(mockSupabase);

    mockAdmin = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    };
    (getSupabaseAdmin as any).mockReturnValue(mockAdmin);
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Unauthorized'),
    });

    const req = new Request('http://localhost:3000/api/student/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarId: 'scratch-cat' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('should reject invalid avatar IDs', async () => {
    const req = new Request('http://localhost:3000/api/student/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarId: 'non-existent-avatar' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('tidak valid');
  });

  it('should reject invalid title IDs', async () => {
    const req = new Request('http://localhost:3000/api/student/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titleId: 'non-existent-title' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('tidak valid');
  });

  it('should successfully update valid avatar and title', async () => {
    const req = new Request('http://localhost:3000/api/student/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarId: 'scratch-cat', titleId: 'sprite-animator' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.avatarId).toBe('scratch-cat');
    expect(json.titleId).toBe('sprite-animator');
  });
});
