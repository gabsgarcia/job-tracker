import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Search engines may read the public pages; the logged-in area is private anyway.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/applications", "/tasks", "/stats", "/auth/confirm", "/auth/update-password"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
