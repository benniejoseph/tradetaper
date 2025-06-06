/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  images: {
    domains: [
      'localhost',
      'storage.googleapis.com',
      'vercel.app',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.railway.app',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
    ],
  },
  async rewrites() {
    // For local development - proxy API calls to backend
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3000/api/:path*',
        },
      ];
    }
    return [];
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if your project has TypeScript errors.
    // Only enable this if you want to deploy despite type errors (not recommended)
    ignoreBuildErrors: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if your project has ESLint errors.
    // Only enable this if you want to deploy despite linting errors (not recommended)
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Enable modern bundling optimizations
    optimizePackageImports: ['@reduxjs/toolkit', 'react-icons'],
  },
};

module.exports = nextConfig; 