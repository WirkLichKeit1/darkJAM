import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["85e42a13-059f-4691-87fe-dfd1c317ba52-00-2lxn6804ysubh.picard.replit.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080"
      },
      {
        protocol: "https",
        hostname: "*.onrender.com",
      },
    ],
  },
};

export default nextConfig;