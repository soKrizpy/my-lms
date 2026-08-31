'use server';

// app/actions/locale.ts
// Server action to switch the app locale.
// Sets the 'locale' cookie and revalidates all cached pages.

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function setLocale(locale: 'id' | 'en') {
  const cookieStore = await cookies();
  cookieStore.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    httpOnly: false, // client needs to read it for immediate UI update
  });
  revalidatePath('/', 'layout');
}
