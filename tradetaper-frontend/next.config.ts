import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        // port: '', // Optional: Defaults to HTTP/HTTPS standard ports
        pathname: '/tradetaper-bucket-images/**', // Adjusted to match bucket structure
      },
      // Add other patterns here if needed
    ],
  },
  /* config options here */
  // Deployment trigger: Updated environment variables for production
};

export default nextConfig;
