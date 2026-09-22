import type { NextConfig } from "next";

// Avatars are stored on Cloudinary and rendered with next/image, which only
// loads remote images from hosts listed here. Scoped to our own cloud name
// (falls back to any path on res.cloudinary.com if the env var isn't set).
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: cloudName ? `/${cloudName}/**` : "/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
