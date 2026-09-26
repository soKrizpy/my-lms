// app/admin/layout.tsx
// Server Component — authorisation guard for the admin area.
//
// Defence-in-depth: middleware is the first line (redirects students at the
// network edge), but this layout is the definitive server-side enforcement.
// Even if middleware is bypassed, non-admin users are redirected here.

import { redirect } from 'next/navigation';
import { getSessionRole } from '@/lib/auth';
import AdminLayoutShell from './AdminLayoutShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Role guard ─────────────────────────────────────────────────────────────
  const role = await getSessionRole();

  if (role === null) {
    // Not logged in → login page
    redirect('/login');
  }

  if (role !== 'admin') {
    // Logged in but not admin (e.g. student) → student dashboard
    redirect('/student');
  }

  return (
    <AdminLayoutShell>
      {children}
    </AdminLayoutShell>
  );
}
