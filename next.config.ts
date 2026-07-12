import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // Apply to all public-facing routes
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            // Allow unload (used by @vercel/analytics) and keep other
            // sensitive APIs restricted.
            value: 'unload=*, camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/listings",
        permanent: true,
      },
      // Forward search queries from /listings?location=X to /listings/all?location=X
      // Handles the old production URL pattern before /listings/all existed.
      {
        source: "/listings",
        has: [{ type: "query", key: "location" }],
        destination: "/listings/all?location=:location",
        permanent: false,
      },
      {
        source: "/listings",
        has: [{ type: "query", key: "type" }],
        destination: "/listings/all?type=:type",
        permanent: false,
      },
      {
        source: "/listings",
        has: [{ type: "query", key: "price" }],
        destination: "/listings/all?price=:price",
        permanent: false,
      },
    ];
  },

  images: {
  formats: ["image/avif", "image/webp"],
  minimumCacheTTL: 86400,
  remotePatterns: [
    {
      protocol: "https",
      hostname: "*.supabase.co",
      pathname: "/storage/v1/object/public/**",
    },
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "photos.app.goo.gl",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "lh3.googleusercontent.com",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "drive.google.com",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "*.fbcdn.net",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "scontent.*.fbcdn.net",
      pathname: "/**",
    },
  ],
  },
};

export default nextConfig;