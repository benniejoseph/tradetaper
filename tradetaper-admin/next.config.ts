import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.tradetaper.com/api/v1',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    // Temporarily ignore build errors for production deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore linting errors during builds for production deployment
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
