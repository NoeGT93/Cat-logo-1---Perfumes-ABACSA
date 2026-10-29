import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { loader: "custom", loaderFile: "./lib/image-loader.js" },
  poweredByHeader: false,
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
    ];
    return [
      { source: "/:path*", headers: security },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
};

export default nextConfig;

// Bindings de Cloudflare (R2 emulado) también en `next dev`.
// WRANGLER_PERSIST: carpeta del R2 local (útil en Windows si la ruta del proyecto es muy larga).
initOpenNextCloudflareForDev(process.env.WRANGLER_PERSIST ? { persist: { path: process.env.WRANGLER_PERSIST } } : undefined);
