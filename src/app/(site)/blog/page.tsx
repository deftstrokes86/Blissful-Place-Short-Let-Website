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

interface BlogPageProps {
  searchParams?: Promise<{
    topic?: string;
    category?: string;
  }>;
}

interface BlogTopicOption {
  value: string;
  label: string;
  matchSlugs: readonly string[];
}

const BLOG_TOPIC_OPTIONS: readonly BlogTopicOption[] = [
  {
    value: "all-posts",
    label: "All Posts",
    matchSlugs: [],
  },
  {
    value: "short-let-guides",
    label: "Short-Let Guides",
    matchSlugs: ["short-let-guides", "short-let-guide", "short-let", "shortlet-guides"],
  },
  {
    value: "lagos-area-guides",
    label: "Lagos Area Guides",
    matchSlugs: ["lagos-area-guides", "lagos-guides", "lagos-area-guide", "lagos"],
  },
  {
    value: "corporate-stays",
    label: "Corporate Stays",
    matchSlugs: ["corporate-stays", "corporate-stay", "business-stays", "business-travel"],
  },
  {
    value: "stay-experience",
    label: "Stay Experience",
    matchSlugs: ["stay-experience", "guest-experience", "stay-tips", "experience"],
  },
];

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

function normalizeTopicParam(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.trim().toLowerCase();
}

function resolveSelectedTopic(value: string): BlogTopicOption {
  return BLOG_TOPIC_OPTIONS.find((topic) => topic.value === value) ?? BLOG_TOPIC_OPTIONS[0];
}

function topicLink(value: string): string {
  if (value === "all-posts") {
    return "/blog";
  }

  return `/blog?topic=${encodeURIComponent(value)}`;
}

function postMatchesTopic(categorySlugs: readonly string[], topic: BlogTopicOption): boolean {
  if (topic.value === "all-posts") {
    return true;
  }

  return categorySlugs.some((slug) => topic.matchSlugs.includes(slug));
}

function resolvePrimaryCategoryLabel(value: { categories: Array<{ title: string }> }): string {
  return value.categories[0]?.title ?? "General";
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const posts = await listPublishedBlogPosts();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedTopicValue = normalizeTopicParam(resolvedSearchParams?.topic ?? resolvedSearchParams?.category);
  const selectedTopic = resolveSelectedTopic(selectedTopicValue);

  const visiblePosts = posts.filter((post) => {
    const postCategorySlugs = post.categories.map((category) => normalizeTopicParam(category.slug));
    return postMatchesTopic(postCategorySlugs, selectedTopic);
  });

  const [featuredPost, ...remainingPosts] = visiblePosts;
  const featuredCategoryLabel = featuredPost ? resolvePrimaryCategoryLabel(featuredPost) : "General";

  const topicNavigation = posts.length > 0 ? (
    <nav className="blog-category-row" aria-label="Blog categories">
      <p className="blog-category-label">Browse topics</p>
      <div className="blog-category-chips">
        {BLOG_TOPIC_OPTIONS.map((topic) => (
          <Link
            key={topic.value}
            href={topicLink(topic.value)}
            className={`blog-category-chip ${selectedTopic.value === topic.value ? "is-active" : ""}`.trim()}
          >
            {topic.label}
          </Link>
        ))}
      </div>
    </nav>
  ) : null;

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
        {topicNavigation}

        {visiblePosts.length === 0 ? (
          <article className="blog-empty-state">
            <h2 className="serif">
              {posts.length === 0 ? "New posts are on the way" : `No posts under ${selectedTopic.label} yet`}
            </h2>
            <p>
              {posts.length === 0
                ? "We are preparing practical guides and updates. You can still reach us directly for booking and stay questions."
                : "Switch topics or view all posts to keep exploring practical guidance for your stay."}
            </p>
            <div className="blog-empty-actions">
              {posts.length > 0 && selectedTopic.value !== "all-posts" ? (
                <Link href="/blog" className="btn btn-outline-white">
                  View all articles
                </Link>
              ) : null}
              <Link href="/contact" className="btn btn-outline-white">
                Make an Inquiry
              </Link>
              <Link href="/book" className="btn btn-primary">
                Book Your Stay
              </Link>
            </div>
          </article>
        ) : (
          <div className="blog-editorial-stack">
            {featuredPost ? (
              <article className="blog-featured">
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="blog-featured-image"
                  aria-label={`Read ${featuredPost.title}`}
                >
                  {featuredPost.featuredImageUrl ? (
                    <Image
                      src={featuredPost.featuredImageUrl}
                      alt={featuredPost.featuredImageAlt || featuredPost.title}
                      fill
                      sizes="(max-width: 960px) 100vw, 48vw"
                      priority
                    />
                  ) : (
                    <span className="blog-image-fallback" aria-hidden="true" />
                  )}
                </Link>

                <div className="blog-featured-body">
                  <div className="blog-card-meta-row">
                    <span className="blog-card-category-chip">{featuredCategoryLabel}</span>
                    <span className="blog-card-date">{formatPublishedDate(featuredPost.publishedAt)}</span>
                  </div>

                  {featuredPost.authorName ? <p className="blog-card-byline">By {featuredPost.authorName}</p> : null}

                  <h2 className="serif blog-featured-title">
                    <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                  </h2>

                  {featuredPost.excerpt ? <p className="blog-featured-excerpt">{featuredPost.excerpt}</p> : null}

                  <Link href={`/blog/${featuredPost.slug}`} className="blog-card-read-link">
                    Read featured article
                  </Link>
                </div>
              </article>
            ) : null}

            <div className="blog-grid-header">
              <h2 className="serif blog-grid-heading">Latest articles</h2>
              <p className="blog-grid-subtle">
                {remainingPosts.length > 0
                  ? `${remainingPosts.length.toString()} more stories to explore.`
                  : "New stories are publishing soon."}
              </p>
            </div>

            <div className="blog-post-grid" aria-label="More published articles">
              {remainingPosts.length > 0 ? (
                remainingPosts.map((post) => {
                  const primaryCategoryLabel = resolvePrimaryCategoryLabel(post);

                  return (
                    <article key={post.id} className="blog-post-card">
                      <Link href={`/blog/${post.slug}`} className="blog-post-card-image" aria-label={`Read ${post.title}`}>
                        {post.featuredImageUrl ? (
                          <Image
                            src={post.featuredImageUrl}
                            alt={post.featuredImageAlt || post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1180px) 50vw, 33vw"
                          />
                        ) : (
                          <span className="blog-image-fallback" aria-hidden="true" />
                        )}
                      </Link>

                      <div className="blog-post-card-body">
                        <div className="blog-card-meta-row">
                          <span className="blog-card-category-chip">{primaryCategoryLabel}</span>
                          <span className="blog-card-date">{formatPublishedDate(post.publishedAt)}</span>
                        </div>

                        <h3 className="serif blog-post-card-title">
                          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </h3>

                        {post.excerpt ? <p className="blog-post-card-excerpt">{post.excerpt}</p> : null}

                        <Link href={`/blog/${post.slug}`} className="blog-card-read-link">
                          Read article
                        </Link>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="blog-grid-note">
                  <h3 className="serif">More articles coming soon</h3>
                  <p>We are publishing new practical guides regularly. Check back soon for more insights.</p>
                </article>
              )}
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
