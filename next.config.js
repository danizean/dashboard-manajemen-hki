/** @type {import('next').NextConfig} */
const nextConfig = {
  // Opsi 'swcMinify' dihapus karena sudah menjadi default dan tidak dikenali lagi
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
