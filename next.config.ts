import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pixel avatars and placeholder scenes are tiny static files; uploaded photos
  // will come from your storage bucket. Add its host here when you wire it up.
  images: { remotePatterns: [] },
};

export default nextConfig;
