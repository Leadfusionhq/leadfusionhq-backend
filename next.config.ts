// next.config.ts
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: process.env.NEXT_PUBLIC_BACKEND_API_URL?.split("://")[0] || "http",
        hostname: process.env.NEXT_PUBLIC_BACKEND_API_URL
          ? new URL(process.env.NEXT_PUBLIC_BACKEND_API_URL).hostname
          : "localhost",
        port: process.env.NEXT_PUBLIC_BACKEND_API_URL
          ? new URL(process.env.NEXT_PUBLIC_BACKEND_API_URL).port
          : "8080",
        pathname: "/**",   
      } as RemotePattern, // ✅ force TypeScript to treat this as RemotePattern
    ],
  },
};

export default nextConfig;

