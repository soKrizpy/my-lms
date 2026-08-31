import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const engineUrl = process.env.LESSON_ENGINE_URL ?? 'http://localhost:3001';
    return [
      {
        source: '/learning/:path*',
        destination: `${engineUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
