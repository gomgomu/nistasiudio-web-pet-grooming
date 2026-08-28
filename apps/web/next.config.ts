import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@petflow/ui', '@petflow/types'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
