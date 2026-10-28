import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  typedRoutes: false,
};

// Gives `next dev` the local D1 binding
initOpenNextCloudflareForDev();

export default nextConfig;
