// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import idMessages from '../messages/id.json';
import enMessages from '../messages/en.json';

export const locales = ['id', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'id';

export default getRequestConfig(async () => {
  let locale: Locale = 'id';
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('locale')?.value;
    if (raw === 'en') locale = 'en';
  } catch {
    // default to 'id'
  }

  return {
    locale,
    messages: locale === 'en' ? enMessages : idMessages,
  };
});
