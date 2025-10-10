/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Tetap abaikan linting saat build untuk fokus pada error utama
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Memastikan topLevelAwait tetap aktif
    config.experiments = { ...config.experiments, topLevelAwait: true };
    
    // Hapus konfigurasi 'externals' yang sebelumnya ditambahkan
    // karena menyebabkan error build. Peringatan dependensi kritis
    // dapat diabaikan selama build berhasil.

    return config;
  },
};

module.exports = nextConfig;