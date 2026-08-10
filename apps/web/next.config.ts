import type { NextConfig } from 'next';

// The browser talks to this stable, same-origin path. Next forwards it to the
// API, which avoids a development-only CORS setup and keeps the upstream URL
// private to the web deployment.
const orbitApiUrl = (process.env.ORBIT_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/orbit/:path*',
        destination: `${orbitApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
