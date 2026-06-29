/** @type {import('next').NextConfig} */
// En Vercel: el navegador llama a /prueba/* (mismo origen) y Next reenvía al backend Oracle.
// BACKEND_URL solo se usa en el servidor (no va en NEXT_PUBLIC_*).
const backendUrl =
  process.env.BACKEND_URL || "https://163.176.32.93:3000"

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
