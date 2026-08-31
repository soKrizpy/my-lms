// i18n/request.ts
// next-intl server-side config — reads locale from cookie.
// Using "i18n without routing" pattern so existing middleware.ts is untouched.
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['id', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'id';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('locale')?.value;
  const locale: Locale = raw === 'en' ? 'en' : 'id';
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
