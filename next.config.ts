import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ allow production builds to complete even if ESLint finds errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
