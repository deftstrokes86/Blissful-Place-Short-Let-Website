import type { MetadataRoute } from "next";

import { getCmsPayload } from "@/cms/payload";
import { getPropertyFlatRoute, PROPERTY_FLAT_IDS } from "@/lib/property-flat-content";
import { listPublishedBlogPosts } from "@/server/cms/blog-content-service";

const siteUrl = "https://www.blissfulplaceresidences.com";
export const dynamic = "force-dynamic";

const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: `${siteUrl}/`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    url: `${siteUrl}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${siteUrl}/property`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${siteUrl}/guide`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${siteUrl}/contact`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${siteUrl}/book`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${siteUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${siteUrl}/privacy-policy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${siteUrl}/terms-of-service`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${siteUrl}/cancellation-policy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${siteUrl}/house-rules`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${siteUrl}/payment-policy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

const propertyFlatRoutes: MetadataRoute.Sitemap = PROPERTY_FLAT_IDS.map((flatId) => ({
  url: `${siteUrl}${getPropertyFlatRoute(flatId)}`,
  lastModified: new Date(),
  changeFrequency: "weekly",
  priority: 0.85,
}));

const excludedRootPaths = new Set([
  "/admin",
  "/staff",
  "/login",
  "/admin/secure-area",
  "/api",
  "/cms",
  "/payload",
  "/preview",
  "/draft",
  "/test",
  "/dev",
  "/debug",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asSlug(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const slug = value.trim();

  if (!slug || slug.includes("/") || slug.includes("?") || slug.includes("#")) {
    return null;
  }

  return slug;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveLastModified(record: Record<string, unknown>): Date {
  return toDate(record.updatedAt) ?? toDate(record.createdAt) ?? toDate(record.publishedAt) ?? new Date();
}

function isExcludedPath(pathname: string): boolean {
  return excludedRootPaths.has(pathname);
}

async function buildBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const posts = await listPublishedBlogPosts(200);
    const routes: MetadataRoute.Sitemap = [];

    for (const post of posts) {
      const slug = asSlug(post.slug);

      if (!slug) {
        continue;
      }

      const pathname = `/blog/${slug}`;
      if (isExcludedPath(pathname)) {
        continue;
      }

      const record = asRecord(post) ?? {};

      routes.push({
        url: `${siteUrl}${pathname}`,
        lastModified: resolveLastModified(record),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    return routes;
  } catch (error) {
    console.error("[sitemap] Failed to load published blog posts.", { error });
    return [];
  }
}

async function buildCmsPageRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const payload = await getCmsPayload();
    const result = await payload.find({
      collection: "cms-pages",
      where: {
        status: {
          equals: "published",
        },
      },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    });

    const docs = Array.isArray(result.docs) ? result.docs : [];
    const routes: MetadataRoute.Sitemap = [];

    for (const doc of docs) {
      const record = asRecord(doc);
      if (!record) {
        continue;
      }

      const slug = asSlug(record.slug);
      if (!slug) {
        continue;
      }

      const pathname = `/pages/${slug}`;
      if (isExcludedPath(pathname)) {
        continue;
      }

      routes.push({
        url: `${siteUrl}${pathname}`,
        lastModified: resolveLastModified(record),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    return routes;
  } catch (error) {
    console.error("[sitemap] Failed to load published CMS pages.", { error });
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogRoutes, cmsPageRoutes] = await Promise.all([buildBlogRoutes(), buildCmsPageRoutes()]);
  return [...staticRoutes, ...propertyFlatRoutes, ...blogRoutes, ...cmsPageRoutes];
}
