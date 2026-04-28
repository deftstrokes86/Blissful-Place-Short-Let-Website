import { Suspense } from "react";

import { BlogListingClient } from "@/components/blog/BlogListingClient";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { sanitizeBlogPagePosts } from "@/lib/blog-page";
import { buildSeoMetadata } from "@/lib/seo";
import { listPublishedBlogPosts } from "@/server/cms/blog-content-service";
import type { PublicBlogPostSummary } from "@/server/cms/blog-public-mappers";

export const metadata = buildSeoMetadata({
  title: "Short-Let Apartment Blog",
  description:
    "Read practical guides on short-let apartments, Lagos mainland stays, travel planning, guest comfort, and booking tips from Blissful Place Residences.",
  path: "/blog",
});
export const dynamic = "force-dynamic";

async function loadBlogPagePosts(): Promise<PublicBlogPostSummary[]> {
  try {
    const posts = await listPublishedBlogPosts();
    const safePosts = sanitizeBlogPagePosts(posts);

    if (safePosts.length !== posts.length) {
      console.warn("[blog/page] Skipping malformed blog posts while rendering index.", {
        totalPosts: posts.length,
        renderedPosts: safePosts.length,
      });
    }

    return safePosts;
  } catch (error) {
    console.error("[blog/page] Failed to load blog posts.", { error });
    return [];
  }
}

export default async function BlogPage() {
  const posts = await loadBlogPagePosts();

  return (
    <main className="blog-page">
      <SiteHeader />

      <section className="container blog-hero">
        <p className="section-subtitle">Insights Journal</p>
        <h1 className="serif blog-title">Guides and Practical Notes for Better Stays</h1>
        <p className="blog-description">
          Read clear, practical articles to help you plan smoothly, settle in faster, and get more from your stay at
          Blissful Place Residences.
        </p>
      </section>

      <Suspense>
        <BlogListingClient posts={posts} />
      </Suspense>

      <SiteFooter />
    </main>
  );
}

