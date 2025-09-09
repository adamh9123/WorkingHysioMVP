import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable external packages for server components
  serverExternalPackages: ['groq-sdk', 'openai'],
  
  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  
  // Images configuration for potential future use
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
