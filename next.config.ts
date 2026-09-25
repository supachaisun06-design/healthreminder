import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@line/bot-sdk"],
};

export default nextConfig;
