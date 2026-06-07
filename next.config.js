/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // Remove i18n entirely or keep only locales if you want
  // i18n: { locales: ['en', 'ar'], defaultLocale: 'en' }, // optional, but localeDetection is not allowed
};

module.exports = nextConfig;