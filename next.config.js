/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Vercel deployment with googleapis (Next.js 14 syntax)
  experimental: {
    serverComponentsExternalPackages: ['googleapis'],
  },
};

module.exports = nextConfig;
