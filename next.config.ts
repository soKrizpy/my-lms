import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  async rewrites() {
    const engineUrl =
      process.env.LESSON_ENGINE_URL ??
      process.env.NEXT_PUBLIC_LESSON_ENGINE_URL ??
      'http://localhost:3001';
    return [
      {
        source: '/learning/:path*',
        destination: `${engineUrl}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
