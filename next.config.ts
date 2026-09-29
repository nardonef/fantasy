import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/opengraph-image": ["./src/assets/**"] },
};

export default nextConfig;
