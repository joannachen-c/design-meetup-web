import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // A lockfile in the home directory makes Turbopack infer the wrong root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
