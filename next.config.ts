import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    if (process.env.CLOUDFLARE_WORKER_BUILD !== "1") {
      config.resolve ??= {};
      config.resolve.alias ??= {};
      config.resolve.alias["cloudflare:workers"] = "./db/vercel-cloudflare-workers-stub.ts";
    }
    return config;
  },
  turbopack: {
    resolveAlias: process.env.CLOUDFLARE_WORKER_BUILD === "1" ? {} : {
      "cloudflare:workers": "./db/vercel-cloudflare-workers-stub.ts",
    },
  },
};

export default nextConfig;
