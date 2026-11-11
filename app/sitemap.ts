import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/auth/sign-up`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${siteUrl}/auth/login`, changeFrequency: "yearly", priority: 0.4 },
  ];
}
