import type { NextConfig } from "next";

function getContentSecurityPolicy() {
  let supabaseOrigin: string | undefined;
  if (process.env.SUPABASE_URL) {
    try {
      supabaseOrigin = new URL(process.env.SUPABASE_URL).origin;
    } catch {
      throw new Error(
        "SUPABASE_URL must be a valid absolute URL to configure the Content Security Policy.",
      );
    }
  }

  const connectSources = [
    "'self'",
    supabaseOrigin,
    supabaseOrigin?.replace(/^https:/, "wss:"),
    process.env.NODE_ENV !== "production" ? "ws:" : undefined,
  ].filter(Boolean);
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    process.env.NODE_ENV !== "production" ? "'unsafe-eval'" : undefined,
  ].filter(Boolean);

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    process.env.NODE_ENV === "production"
      ? "upgrade-insecure-requests"
      : undefined,
  ]
    .filter(Boolean)
    .join("; ");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: getContentSecurityPolicy(),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
