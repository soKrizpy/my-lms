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
        // Proxy all engine routes (lesson pages, API, _next assets)
        source: '/learning/:path*',
        destination: `${engineUrl}/:path*`,
      },
      {
        // Proxy engine static lesson JSON files so fetch('/lessons/...') works
        // when the engine page is loaded via the /learning/* proxy on this origin.
        source: '/lessons/:path*',
        destination: `${engineUrl}/lessons/:path*`,
      },
    ];
  },
};

export default nextConfig;
