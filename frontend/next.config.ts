import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle (.next/standalone) - only for the Docker image
  // (set by frontend/Dockerfile). Vercel builds use Next's default output.
  ...(process.env.NEXT_OUTPUT_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  poweredByHeader: false,
};

export default nextConfig;
