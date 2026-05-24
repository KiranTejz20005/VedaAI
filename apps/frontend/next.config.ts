import type { NextConfig } from "next";
import path from "path";

const DEFAULT_BACKEND = "https://vedaai-test.onrender.com";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BACKEND,
    NEXT_PUBLIC_SOCKET_URL:
      process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BACKEND,
  },
};

export default nextConfig;
