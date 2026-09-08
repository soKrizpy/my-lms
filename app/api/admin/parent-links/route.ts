// app/api/admin/parent-links/route.ts
// POST /api/admin/parent-links
// Admin only. Generate a shareable parent report link for a student,
// optionally tied to an invoice.
// Returns { url, token } — URL is ready to copy-paste to parents.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;
  const admin = auth.adminClient;

  const body = await req.json() as { studentId: string; invoiceId?: string };
  if (!body.studentId) {
    return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
  }

  // Insert new link — token and expires_at have DB defaults
  const { data, error } = await admin
    .from('parent_links')
    .insert({
      student_id: body.studentId,
      invoice_id: body.invoiceId ?? null,
    })
    .select('token')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create link' }, { status: 500 });
  }

  // Build the shareable URL reliably.
  // - origin header is absent for same-origin fetch (most admin calls) → use host + protocol
  // - NEXT_PUBLIC_APP_URL is the canonical fallback for custom domains on Vercel
  const origin =
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (() => {
      const host = req.headers.get('host') ?? 'localhost:3000';
      const proto = req.headers.get('x-forwarded-proto') ?? 'https';
      return `${proto}://${host}`;
    })();
  const url = `${origin}/parent/${data.token}`;
  return NextResponse.json({ url, token: data.token });
}
