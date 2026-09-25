import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@line/bot-sdk"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existingExternals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
        ? [config.externals]
        : [];
      config.externals = [
        ...existingExternals,
        "@line/bot-sdk",
        "@prisma/client",
        "@prisma/engines",
      ];
    }
    return config;
  },
};

export default nextConfig;
