import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sanad.org.eg";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/private/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
