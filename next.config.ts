import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output: 'export' to allow dynamic routes
  // Deploy to Vercel or use Netlify's Next.js runtime
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
