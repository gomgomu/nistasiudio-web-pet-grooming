import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@petflow/ui', '@petflow/types'],
};

export default nextConfig;
