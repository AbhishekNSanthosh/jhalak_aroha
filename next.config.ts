import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com', // For LinkedIn Profile Pictures
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'assets.vercel.com', // For Tech Stack Icons
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
