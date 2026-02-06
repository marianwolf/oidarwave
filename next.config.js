/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['profilbild.vercel.app'],
  },
};

module.exports = nextConfig;
