/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@whiskeysockets/baileys', 'pino', 'pino-pretty'],
  },
}
export default nextConfig
