import { getRequestConfig } from 'next-intl/server';
import idMessages from '../messages/id.json';

// Always serve Bahasa Indonesia. The EN locale and dual-language toggle
// have been removed. This file is retained only because next-intl is still
// a transitive dependency; once next-intl is fully uninstalled it can be deleted.
export default getRequestConfig(async () => {
  return {
    locale: 'id',
    messages: idMessages,
  };
});
