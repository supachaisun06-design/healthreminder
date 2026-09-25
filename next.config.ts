import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@line/bot-sdk"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
