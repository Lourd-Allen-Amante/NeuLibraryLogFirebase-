import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // DELETE output: 'export' FROM HERE
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, 
    remotePatterns: [
      // ... your patterns
    ],
  },
};

export default nextConfig;