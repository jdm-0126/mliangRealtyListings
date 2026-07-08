import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Allow Next.js Image Optimization for all common photo hosting domains used
    // by property listings (Supabase storage, Google Photos/Drive, Unsplash).
    // Removing `unoptimized` on ListingCard lets Next.js auto-convert to WebP
    // and serve appropriately-sized images per the `sizes` attribute.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // cache optimized images for 24 h
    remotePatterns: [
      // Supabase Storage (project-specific bucket URLs)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Google Photos / Drive shared links
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      // Cloudinary (if used)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Unsplash (dev seed images)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
    ],
  },
  // Add empty turbopack config to silence the warning
  // next-pwa uses webpack, so we acknowledge this intentionally
  turbopack: {},
};

module.exports = withPWA(nextConfig);
