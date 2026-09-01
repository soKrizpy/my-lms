import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  async rewrites() {
    // LESSON_ENGINE_URL = server-only env var (no NEXT_PUBLIC_ prefix needed in next.config)
    // Falls back to NEXT_PUBLIC_LESSON_ENGINE_URL so both names work in .env.local
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
