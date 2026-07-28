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
 * img-src allows Cloudinary (the media store) plus data:/blob: for the QR pass
 * data-URI and the client-side image cropper preview.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "media-src 'self' https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self' https://res.cloudinary.com",
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
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
