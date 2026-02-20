import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        // Allow all paths from Google Cloud Storage
        pathname: '/**',
      },
      // Add other patterns here if needed
    ],
  },
  async redirects() {
    return [
      {
        source: '/discipline',
        destination: '/trader-mind',
        permanent: true,
      },
      {
        source: '/psychology',
        destination: '/trader-mind',
        permanent: true,
      },
    ];
  },
  /* config options here */
  // Deployment trigger: Added NEXT_PUBLIC_API_URL environment variable for production
};

export default nextConfig;
