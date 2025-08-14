/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    } else {
      config.externals.push({
        './.next/worker-script/node/index.js': 'commonjs ./.next/worker-script/node/index.js',
      });
    }
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    return config;
  },
}

export default nextConfig
