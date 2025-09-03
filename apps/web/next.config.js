/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir est maintenant activé par défaut dans Next.js 13+
  // output: 'standalone', // Désactivé temporairement pour éviter les erreurs de permissions Windows
  transpilePackages: [
    '@elavira/config',
    '@elavira/core',
    '@elavira/rag',
    '@elavira/ui',
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;
