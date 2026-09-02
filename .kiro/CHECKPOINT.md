# ✅ CHECKPOINT — Student Dashboard Working

**Tanggal:** 2 September 2026  
**Commit:** `68478772da3af72cd325829451de07e7f3ba4b6d`  
**Short:** `6847877`  
**Tag:** `checkpoint-student-dashboard-working`  
**Branch:** `main`  
**Status:** Student dashboard FULLY WORKING di Vercel production ✅

---

## Cara Restore ke Checkpoint Ini

Jika ada breaking change di masa depan, restore ke state ini dengan:

```bash
git checkout checkpoint-student-dashboard-working
```

Atau hard reset:

```bash
git reset --hard 68478772da3af72cd325829451de07e7f3ba4b6d
git push origin main --force
```

---

## State Sistem Saat Checkpoint

### File Kunci & Kondisinya

| File | Status | Catatan |
|------|--------|---------|
| `next.config.ts` | ✅ | `turbopack.resolveAlias` untuk next-intl |
| `i18n/request.ts` | ✅ | Static imports (bukan dynamic) |
| `app/student/layout.tsx` | ✅ | NextIntlClientProvider + static imports |
| `lib/topicUnlock.ts` | ✅ | Error handling lengkap |
| `app/api/student/dashboard/route.ts` | ✅ | Error handling semua queries |
| `components/MagicalCounter.tsx` | ✅ | requestAnimationFrame (bukan animejs) |
| `app/admin/modules/page.tsx` | ✅ | Link dipindah keluar dari `<summary>` |

### Stack yang Berjalan

- **Next.js:** 16.2.10 (Turbopack default)
- **next-intl:** 3.26.3
- **React:** 19.2.4
- **Supabase:** @supabase/ssr ^0.12.3
- **Node:** v24.14.0

---

## Root Causes yang Sudah Diperbaiki

### 1. Student Login Crash (HTTP 500)
- **Penyebab:** Dashboard API tidak punya error handling untuk Supabase queries
- **File:** `app/api/student/dashboard/route.ts`, `lib/topicUnlock.ts`
- **Fix:** Wrap semua queries dengan try-catch + safe defaults

### 2. Server Component Error (ERROR 766865420)
- **Penyebab Sebenarnya:** `turbopack.resolveAlias` untuk next-intl tidak dikonfigurasi
- **Kronologi kegagalan:**
  - next-intl plugin cek `process.env.TURBOPACK` → `undefined`
  - Plugin pakai webpack alias — tapi Next.js 16 tidak punya webpack
  - Turbopack tidak bisa resolve `next-intl/config`
  - Setiap request ke `/student` crash
- **File:** `next.config.ts`
- **Fix:** Hapus plugin, gunakan `turbopack.resolveAlias` native Next.js 16
- **File lain terkait:** `i18n/request.ts` (dynamic import → static import)

### 3. Client-Side Crash (Uncaught Error)
- **Penyebab:** `MagicalCounter.tsx` menggunakan animejs v3 API tapi v4.5.0 terinstall
- **File:** `components/MagicalCounter.tsx`
- **Fix:** Ganti dengan native `requestAnimationFrame` + easeOutExpo

### 4. Accessibility Violations
- **Penyebab:** `<Link>` di dalam `<summary>` element
- **File:** `app/admin/modules/page.tsx`
- **Fix:** Pindahkan link keluar dari `<summary>` ke dalam expanded content

---

## Konfigurasi next-intl yang Benar untuk Next.js 16

```typescript
// next.config.ts — JANGAN gunakan createNextIntlPlugin
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      'next-intl/config': './i18n/request.ts',  // ← kunci utama
    },
  },
  // ...
};

export default nextConfig;
```

```typescript
// i18n/request.ts — WAJIB static imports, bukan dynamic
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import idMessages from '../messages/id.json';   // ← static
import enMessages from '../messages/en.json';   // ← static

export default getRequestConfig(async () => {
  let locale = 'id';
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('locale')?.value;
    if (raw === 'en') locale = 'en';
  } catch { /* default 'id' */ }
  return { locale, messages: locale === 'en' ? enMessages : idMessages };
});
```

```typescript
// app/student/layout.tsx — NextIntlClientProvider wajib ada
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import idMessages from '../../messages/id.json';
import enMessages from '../../messages/en.json';

export default async function StudentLayout({ children }) {
  let locale = 'id';
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('locale')?.value === 'en') locale = 'en';
  } catch {}
  const messages = locale === 'en' ? enMessages : idMessages;
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* layout content */}
    </NextIntlClientProvider>
  );
}
```

---

## Pelajaran Penting

1. **Dev mode dulu** sebelum debug production — error digest seperti `ERROR 766865420` tidak berguna tanpa stack trace
2. **Dynamic import template literal** (`await import(\`./\${var}.json\`)`) tidak reliable di Vercel/Turbopack — selalu gunakan static import
3. **next-intl plugin tidak kompatibel dengan Next.js 16 Turbopack** — gunakan `turbopack.resolveAlias` langsung
4. **Cek `node_modules` docs** (`node_modules/next/dist/docs/`) sebelum asumsi API

---

## Two Repos

| Repo | Path | Status |
|------|------|--------|
| bits2bytes-lms | `d:\BITES2BYTES\bits2bytes-lms` | ✅ Working |
| bits2bytes-lesson-engine | `d:\BITES2BYTES\bits2bytes-lesson-engine` | Belum diverifikasi |

---

*Checkpoint ini dibuat oleh Kiro pada 2 September 2026*
