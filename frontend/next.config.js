/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:8000',
  },
  images: {
    domains: ['localhost', 'cdn.scriptsensei.com'],
  },
  webpack: (config, { isServer }) => {
    // Exclude canvas from server-side bundle (required for Konva)
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas']
    }
    return config
  },
}

module.exports = nextConfig
