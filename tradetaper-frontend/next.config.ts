import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
