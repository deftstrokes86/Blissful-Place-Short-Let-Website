import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { listPublishedBlogPosts } from "@/server/cms/blog-content-service";

export const metadata: Metadata = {
  title: "Blog | Blissful Place Residences",
  description:
    "Practical hospitality insights from Blissful Place Residences covering stays, booking preparation, and local living in Ijaiye/Agbado/Kollington.",
};

function formatPublishedDate(value: string | null): string {
  if (!value) {
    return "Unscheduled";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await listPublishedBlogPosts();

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

      <section className="container blog-listing" aria-label="Published blog posts">
        {posts.length === 0 ? (
          <article className="blog-empty-state">
            <h2 className="serif">New posts are on the way</h2>
            <p>
              We are preparing practical guides and updates. You can still reach us directly for booking and stay
              questions.
            </p>
            <div className="blog-empty-actions">
              <Link href="/contact" className="btn btn-outline-white">
                Make an Inquiry
              </Link>
              <Link href="/book" className="btn btn-primary">
                Book Your Stay
              </Link>
            </div>
          </article>
        ) : (
          <div className="blog-grid">
            {posts.map((post) => (
              <article key={post.id} className="blog-card">
                {post.featuredImageUrl ? (
                  <Link href={`/blog/${post.slug}`} className="blog-card-image" aria-label={`Read ${post.title}`}>
                    <Image
                      src={post.featuredImageUrl}
                      alt={post.featuredImageAlt || post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </Link>
                ) : null}

                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span>{formatPublishedDate(post.publishedAt)}</span>
                    {post.categories[0] ? <span>{post.categories[0].title}</span> : null}
                    {post.authorName ? <span>By {post.authorName}</span> : null}
                  </div>

                  <h2 className="serif">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  {post.excerpt ? <p>{post.excerpt}</p> : null}

                  <Link href={`/blog/${post.slug}`} className="blog-read-link">
                    Read article
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
