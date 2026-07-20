import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
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
      {
        source: '/privacy',
        destination: '/legal/privacy',
        permanent: true,
      },
      {
        source: '/terms',
        destination: '/legal/terms',
        permanent: true,
      },
      {
        source: '/refund',
        destination: '/legal/cancellation-refund',
        permanent: true,
      },
    ];
  },
  /* config options here */
  // Deployment trigger: Added NEXT_PUBLIC_API_URL environment variable for production
};

export default nextConfig;
