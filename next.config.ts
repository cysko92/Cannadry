import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Licence documents and COAs are capped at 4 MB (Vercel functions accept up to 4.5 MB).
    serverActions: { bodySizeLimit: "4.4mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
