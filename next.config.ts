import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: "/",
        destination: "/listings",
        permanent: true,
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
  ],
  },
};

export default nextConfig;