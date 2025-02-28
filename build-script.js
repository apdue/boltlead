// build-script.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting build diagnosis...');

// Check for Babel configuration files
const babelFiles = ['.babelrc', 'babel.config.js', 'babel.config.json'];
babelFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`Found ${file}, removing to use Next.js defaults...`);
    fs.unlinkSync(file);
  }
});

// Create a minimal next.config.js
console.log('Creating minimal next.config.js...');
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['graph.facebook.com']
  },
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  poweredByHeader: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
    };
    return config;
  }
};

module.exports = nextConfig;`;

fs.writeFileSync('next.config.js', nextConfig);

// Try to build with increased memory
console.log('Attempting build with increased memory...');
try {
  execSync('NODE_OPTIONS="--max-old-space-size=4096" npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed with error:', error.message);
  
  // Try with production flag
  console.log('Attempting build with NODE_ENV=production...');
  try {
    execSync('NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" npm run build', { stdio: 'inherit' });
    console.log('Build completed successfully with NODE_ENV=production!');
  } catch (error) {
    console.error('Build failed again with error:', error.message);
  }
} 