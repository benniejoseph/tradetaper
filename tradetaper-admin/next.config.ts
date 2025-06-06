import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  },
  typescript: {
    // Don't ignore build errors in development
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't ignore linting errors during builds
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
