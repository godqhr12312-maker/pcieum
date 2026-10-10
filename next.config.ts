import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Send complete metadata in the initial <head> for every visitor and crawler.
  // Streaming metadata otherwise lands in <body>, which head-only consumers miss.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
