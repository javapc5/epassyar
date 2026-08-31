/** @type {import('next').NextConfig} */
/**
 * Content-Security-Policy.
 *
 * 'unsafe-inline' on script-src is required by Next.js's inline bootstrap and
 * hydration payload; a nonce-based policy needs middleware to stamp every
 * response and is a larger change than this pass. Even so, the policy pins
 * where scripts, images, media and connections may come from, which is what
 * actually contains an injected payload.
 *
 * Media is served from the app's own origin ('self') — public files at
 * /uploads/ and gated ones at /api/admin/media/. data:/blob: cover the QR pass
 * data-URI and the client-side image cropper preview.
 *
 * 'unsafe-eval' is added in development only: `next dev` (React's error overlay,
 * Fast Refresh diagnostics) relies on eval, which the production policy must not
 * allow. React never uses eval in a production build, so nothing is lost there.
 */
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Two years, including subdomains — set only in production so local http dev
  // is not pinned to https by the browser's HSTS cache.
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  // All media is served from this app's own origin now (local disk), so no
  // remote image hosts need allow-listing.
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
