/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['graph.facebook.com', 'platform-lookaside.fbsbx.com'],
  },
  experimental: {
    serverActions: true,
  },
  // Explicitly enable SWC and disable Babel
  swcMinify: false,
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true
  },
  webpack: (config) => {
    // Disable minification in webpack as well
    if (config.optimization && config.optimization.minimizer) {
      config.optimization.minimizer = [];
    }
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
    };
    return config;
  },
}

module.exports = nextConfig