/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/locator/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Allow iframe embedding
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;", // Allow embedding from any domain (domain whitelist is handled in API)
          },
        ],
      },
    ]
  },
}

export default nextConfig
