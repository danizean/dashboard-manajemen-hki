/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Menambahkan aturan untuk menangani file .mjs dengan benar
    // Lihat: https://github.com/vercel/next.js/issues/38863
    config.module.rules.push({
      test: /.*\.mjs$/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    return config
  },
};

module.exports = nextConfig;