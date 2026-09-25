import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/shop", "/admin", "/account", "/documents", "/pending", "/age-check", "/auth"],
    },
    sitemap: `${env.siteUrl()}/sitemap.xml`,
  };
}
