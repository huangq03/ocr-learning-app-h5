import fs from 'fs';
import path from 'path';

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
  experimental: {
    allowedDevOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://0.0.0.0:3000'], // Add your allowed origins here
  },
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      const copyTesseractData = (dir) => {
        const sourceDir = path.join(config.context, `node_modules/tesseract.js/src/${dir}`);
        const destDir = path.join(config.context, `.next/${dir}`);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.cpSync(sourceDir, destDir, { recursive: true });
        const destDirProd = path.join(config.context, `.next/server/app/${dir}`);
        if (!fs.existsSync(destDirProd)) {
          fs.mkdirSync(destDirProd, { recursive: true });
        }
        fs.cpSync(sourceDir, destDirProd, { recursive: true });
      }
      copyTesseractData('worker-script');
      copyTesseractData('constants');
      copyTesseractData('utils');
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    return config;
  },
}

export default nextConfig
