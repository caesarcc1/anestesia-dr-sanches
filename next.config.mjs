/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite imagens externas caso necessário
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
