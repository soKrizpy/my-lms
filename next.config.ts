import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      'next-intl/config': './i18n/request.ts',
    },
  },
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

export default nextConfig;
