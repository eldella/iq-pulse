import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js blocks cross-origin requests to dev-only assets by default
  // (only `localhost` is allowed out of the box) - without this, opening
  // the dev server from the LAN IP or the localtunnel URL loads the initial
  // HTML but silently fails to fetch the JS/CSS bundles, so only inline/SSR
  // markup (background, static emoji) shows up and nothing else does.
  allowedDevOrigins: ["192.168.0.43", "*.loca.lt"],
};

export default nextConfig;
