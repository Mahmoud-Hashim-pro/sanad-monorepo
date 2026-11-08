/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@sanad/shared", "@sanad/database"],
};

export default nextConfig;
