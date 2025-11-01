/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: ["localhost", "yourdomain.com"], // add external domains if needed
  },
};

export default nextConfig;
