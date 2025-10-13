/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Tetap abaikan linting saat build untuk fokus pada error utama
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;