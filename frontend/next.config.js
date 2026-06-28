/** @type {import('next').NextConfig} */
const backendUrl =
  process.env.BACKEND_URL || "http://163.176.32.93:3000"

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/prueba/:path*",
        destination: `${backendUrl}/prueba/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
