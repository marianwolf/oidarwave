/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'oidarvawe.vercel.app',
      'beta0.vercel.app',
      'gamma2.vercel.app',
    ],
  },
};

module.exports = nextConfig;
