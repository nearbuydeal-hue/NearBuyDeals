import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return [];
  }

  const publicPaths = ["/", "/listings", "/privacy", "/terms"];
  return publicPaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
