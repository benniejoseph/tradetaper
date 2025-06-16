import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        // port: '', // Optional: Defaults to HTTP/HTTPS standard ports
        pathname: '/tradetaper-uploads/**', // Fixed to match actual bucket name
      },
      // Add other patterns here if needed
    ],
  },
  /* config options here */
  // Deployment trigger: Added NEXT_PUBLIC_API_URL environment variable for production
};

export default nextConfig;
