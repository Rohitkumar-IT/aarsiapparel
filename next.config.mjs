const API = (process.env.API_BASE_URL || "https://admin.aarsiapparel.com").replace(/\/$/, "");
const apiUrl = new URL(API);

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  experimental: { optimizePackageImports: ["lucide-react"] },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: apiUrl.protocol.replace(":", ""), hostname: apiUrl.hostname, ...(apiUrl.port ? { port: apiUrl.port } : {}) },
    ],
  },
  // Same-origin proxy: the browser talks to /api/v1/* on the storefront domain, so the
  // HttpOnly customer cookie works without CORS. Server components call API_BASE_URL directly.
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API}/api/v1/:path*` },
      { source: "/api/objects/:path*", destination: `${API}/api/objects/:path*` },
    ];
  },
  async redirects() {
    return [{ source: "/signup", destination: "/login", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
