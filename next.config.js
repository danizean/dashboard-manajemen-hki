/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // A an unhandled rejection handler to suppress the warning
    // See: https://github.com/vercel/next.js/issues/38863
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