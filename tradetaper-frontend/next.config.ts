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
  /* config options here */
  // Deployment trigger: Added NEXT_PUBLIC_API_URL environment variable for production
};

export default nextConfig;
