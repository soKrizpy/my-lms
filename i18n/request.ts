import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import idMessages from '../messages/id.json';
import enMessages from '../messages/en.json';

export default getRequestConfig(async () => {
  let locale = 'id';
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('locale')?.value;
    if (raw === 'en') locale = 'en';
  } catch {
    // default 'id'
  }
  return {
    locale,
    messages: locale === 'en' ? enMessages : idMessages,
  };
});
