import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.+\.(png|jpg|jpeg|gif|webp|avif|svg)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 120,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/.+\.(css|js|json|wasm)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Permanent edge redirect: zero serverless function invocation.
      // Vercel handles 308s at the CDN layer before the request ever
      // reaches a Lambda, so there's no cold-start penalty on /.
      {
        source: '/',
        destination: '/listings',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      // ── Immutable static chunks (Next.js build output) ──────────────────
      // Next.js already sets this internally, but being explicit ensures
      // Vercel's CDN layer also caches them at the edge.
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ── Public folder: fonts ─────────────────────────────────────────────
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ── Public folder: images / icons / PWA assets ──────────────────────
      {
        source: '/:path*.{ico,png,jpg,jpeg,gif,webp,avif,svg}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // ── Public folder: JS / CSS / JSON / WASM (non-hashed) ──────────────
      {
        source: '/:path*.{js,css,json,wasm}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // ── PWA manifests ────────────────────────────────────────────────────
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ]
  },
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

export default withPWA(nextConfig);
