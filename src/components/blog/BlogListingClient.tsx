"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { SafeBlogImage } from "@/components/blog/SafeBlogImage";
import {
  BLOG_TOPIC_OPTIONS,
  buildBlogTopicLink,
  formatBlogPublishedDate,
  normalizeBlogTopicParam,
  postMatchesBlogTopic,
  resolvePrimaryBlogCategoryLabel,
  resolveSelectedBlogTopic,
} from "@/lib/blog-page";
import type { PublicBlogPostSummary } from "@/server/cms/blog-public-mappers";

interface BlogListingClientProps {
  posts: PublicBlogPostSummary[];
}

export function BlogListingClient({ posts }: BlogListingClientProps) {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic") ?? searchParams.get("category") ?? undefined;
  const selectedTopicValue = normalizeBlogTopicParam(topicParam);
  const selectedTopic = resolveSelectedBlogTopic(selectedTopicValue);

  const visiblePosts = posts.filter((post) => {
    const postCategorySlugs = post.categories.map((category) => normalizeBlogTopicParam(category.slug));
    return postMatchesBlogTopic(postCategorySlugs, selectedTopic);
  });

  const [featuredPost, ...remainingPosts] = visiblePosts;
  const featuredCategoryLabel = featuredPost ? resolvePrimaryBlogCategoryLabel(featuredPost) : "General";

  const topicNavigation =
    posts.length > 0 ? (
      <nav className="blog-category-row" aria-label="Blog categories">
        <p className="blog-category-label">Browse topics</p>
        <div className="blog-category-chips">
          {BLOG_TOPIC_OPTIONS.map((topic) => (
            <Link
              key={topic.value}
              href={buildBlogTopicLink(topic.value)}
              className={`blog-category-chip ${selectedTopic.value === topic.value ? "is-active" : ""}`.trim()}
            >
              {topic.label}
            </Link>
          ))}
        </div>
      </nav>
    ) : null;

  return (
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
                <SafeBlogImage
                  src={featuredPost.featuredImageUrl}
                  alt={featuredPost.featuredImageAlt || featuredPost.title}
                  sizes="(max-width: 960px) 100vw, 48vw"
                />
              </Link>

              <div className="blog-featured-body">
                <div className="blog-card-meta-row">
                  <span className="blog-card-category-chip">{featuredCategoryLabel}</span>
                  <span className="blog-card-date">{formatBlogPublishedDate(featuredPost.publishedAt)}</span>
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
                const primaryCategoryLabel = resolvePrimaryBlogCategoryLabel(post);

                return (
                  <article key={post.id} className="blog-post-card">
                    <Link href={`/blog/${post.slug}`} className="blog-post-card-image" aria-label={`Read ${post.title}`}>
                      <SafeBlogImage
                        src={post.featuredImageUrl}
                        alt={post.featuredImageAlt || post.title}
                        sizes="(max-width: 768px) 100vw, (max-width: 1180px) 50vw, 33vw"
                      />
                    </Link>

                    <div className="blog-post-card-body">
                      <div className="blog-card-meta-row">
                        <span className="blog-card-category-chip">{primaryCategoryLabel}</span>
                        <span className="blog-card-date">{formatBlogPublishedDate(post.publishedAt)}</span>
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
  );
}
