import type { MetadataRoute } from "next";

const siteUrl = "https://www.blissfulplaceresidences.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/staff/",
        "/login",
        "/admin/secure-area",
        "/api/",
        "/_next/",
        "/cms/",
        "/payload/",
        "/preview/",
        "/draft/",
        "/test/",
        "/dev/",
        "/debug/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
