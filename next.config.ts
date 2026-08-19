import type { NextConfig } from "next";
import {
  IMAGE_DEVICE_SIZES,
  IMAGE_QUALITIES,
  IMAGE_SIZES,
} from "./src/lib/image-optimizer.ts";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  serverExternalPackages: ["imapflow"],
  // A lockfile in the home directory makes Turbopack infer the wrong root.
  turbopack: {
    root: __dirname,
  },
  images: {
    // Gallery photos and covers live in public Storage buckets. Resizing them
    // here (Vercel CDN) instead of `/storage/v1/render/image` keeps the Free
    // plan's Image Transformation quota at zero and cuts origin egress: each
    // unique size is fetched from Supabase once, then cached.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    deviceSizes: [...IMAGE_DEVICE_SIZES],
    imageSizes: [...IMAGE_SIZES],
    qualities: [...IMAGE_QUALITIES],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 31,
    contentDispositionType: "inline",
  },
};

export default nextConfig;
