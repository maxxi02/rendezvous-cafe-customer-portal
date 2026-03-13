import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile images
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com", // fallback avatars
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com", // catch-all for Google
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Story Images
      },
    ],
  },
};

export default nextConfig;
