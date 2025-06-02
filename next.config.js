/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    // Only need rewrites for development to proxy API calls
    if (process.env.NODE_ENV === "development") {
      // Use environment variable for backend URL, default to localhost for local dev
      const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";

      return [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: "/docs",
          destination: `${backendUrl}/docs`,
        },
        {
          source: "/openapi.json",
          destination: `${backendUrl}/openapi.json`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
