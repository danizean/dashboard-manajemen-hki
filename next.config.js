/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
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