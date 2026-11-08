/** @type {import('next').NextConfig} */
// Ensure local font fetching succeeds in environments with custom root certificates / proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
