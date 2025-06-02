/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  rewrites: async () => {
    // Only apply rewrites in development
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:8000/api/:path*",
        },
        {
          source: "/docs",
          destination: "http://127.0.0.1:8000/docs",
        },
        {
          source: "/openapi.json",
          destination: "http://127.0.0.1:8000/openapi.json",
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
