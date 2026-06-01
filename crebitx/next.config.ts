import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    const devRoutes = [
      "/test-login",
      "/working-login",
      "/simple-test",
      "/network-test",
      "/api-test",
      "/dashboard-new",
      "/verify",
    ];

    return devRoutes.map((source) => ({
      source,
      destination: "/",
      permanent: false,
    }));
  },
};

export default nextConfig;
