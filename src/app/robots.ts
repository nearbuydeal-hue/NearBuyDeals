import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/listings", "/privacy", "/terms"],
      disallow: [
        "/admin/",
        "/dashboard",
        "/api/",
        "/auth/",
        "/login",
        "/signup",
      ],
    },
    ...(siteUrl ? { sitemap: new URL("/sitemap.xml", siteUrl).toString() } : {}),
  };
}
