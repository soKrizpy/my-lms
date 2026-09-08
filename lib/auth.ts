// lib/auth.ts
// Centralised authentication + authorisation helpers.
//
// ROLE MODEL:
//   - public.profiles.role = 'admin'   → admin/teacher
//   - public.profiles.role = 'student' → student (or any other value)
//   - no profiles row                  → treated as non-admin for safety
//
// Usage in API Route Handlers:
//   const auth = await requireAdmin(request);
//   if (auth.error) return auth.error;    // 401 or 403 Response already built
//   // auth.user and auth.adminClient are available
//
// Usage in Server Components / Layouts:
//   const role = await getSessionRole();
//   if (role !== 'admin') redirect('/login');

import { createClient } from './supabase/server';
import { getSupabaseAdmin } from './supabaseAdmin';
import { NextRequest } from 'next/server';

export type UserRole = 'admin' | 'student' | null;

/**
 * Returns the authenticated user's role from public.profiles.
 * Returns null if the user is not logged in or has no profile row.
 * Safe to call from Server Components and Route Handlers.
 */
export async function getSessionRole(): Promise<UserRole> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role as string | undefined;
    if (role === 'admin') return 'admin';
    if (role === 'student') return 'student';
    return null;
  } catch {
    return null;
  }
}

/**
 * Guard for API Route Handlers that require admin access.
 *
 * Returns either:
 *   { error: Response }  → caller must return this response immediately
 *   { user, adminClient } → request is authorised; proceed
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAdmin(request);
 *   if ('error' in auth) return auth.error;
 *   // safe to proceed
 * }
 */
export async function requireAdmin(
  _request?: NextRequest
): Promise<
  | { error: Response }
  | { user: { id: string; email?: string }; adminClient: ReturnType<typeof getSupabaseAdmin> }
> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: Response.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    const adminClient = getSupabaseAdmin();
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return {
        error: Response.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    return { user: { id: user.id, email: user.email }, adminClient };
  } catch {
    return {
      error: Response.json({ error: 'Internal server error' }, { status: 500 }),
    };
  }
}
