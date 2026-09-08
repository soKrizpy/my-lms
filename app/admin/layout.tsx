// app/admin/layout.tsx
// Server Component — authorisation guard + locale for the admin area.
//
// Defence-in-depth: middleware is the first line (redirects students at the
// network edge), but this layout is the definitive server-side enforcement.
// Even if middleware is bypassed, non-admin users are redirected here.

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
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

  // ── Locale for language toggle ─────────────────────────────────────────────
  let locale = 'id';
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('locale')?.value;
    if (raw === 'en') locale = 'en';
  } catch {
    // default to 'id'
  }

  return (
    <AdminLayoutShell locale={locale}>
      {children}
    </AdminLayoutShell>
  );
}
