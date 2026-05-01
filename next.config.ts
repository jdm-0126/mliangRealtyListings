import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Add empty turbopack config to silence the warning
  // next-pwa uses webpack, so we acknowledge this intentionally
  turbopack: {},
};

module.exports = withPWA(nextConfig);
