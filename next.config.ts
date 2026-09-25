import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://13.49.90.62:3000";
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "kuber",
  project: "web-admin",

  silent: true,

  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
