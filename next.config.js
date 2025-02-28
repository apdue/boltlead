/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['graph.facebook.com'] // Add Facebook domain for images
  },
  // Ensure data directory is preserved during builds
  distDir: '.next',
  // Add output configuration for dynamic routes
  output: 'standalone',
  // Configure experimental features
  experimental: {
    serverActions: true,
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
      ],
    },
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Increase build timeout if needed
  staticPageGenerationTimeout: 180,
  // Enable strict mode for better error catching
  reactStrictMode: true,
  // Disable x-powered-by header
  poweredByHeader: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
    };
    return config;
  },
  transpilePackages: [
    '@radix-ui/react-primitive',
    '@radix-ui/react-dialog',
    '@radix-ui/react-select',
    '@radix-ui/react-tabs',
    '@radix-ui/react-popover',
    '@radix-ui/react-arrow',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-dismissable-layer',
    '@radix-ui/react-focus-scope'
  ]
};

module.exports = nextConfig;