import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/how-it-works", "/about", "/contact", "/request-access", "/privacy", "/terms"].map((p) => ({
    url: `${env.siteUrl()}${p}`,
  }));
}
