import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SafeBlogImage } from "@/components/blog/SafeBlogImage";
import { hasRenderableBlogImageCandidate } from "@/lib/blog-image";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  buildPublicBlogPostMetadata,
  extractLexicalParagraphs,
  resolvePublicLexicalContentState,
  resolvePublicBlogIntro,
} from "@/server/cms/blog-public-content";
import { findPublishedBlogPostBySlug } from "@/server/cms/blog-content-service";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

const getPublishedPostBySlug = cache(async (slug: string) => {
  return findPublishedBlogPostBySlug(slug);
});

function formatPublishedDate(value: string | null): string {
  if (!value) {
    return "Scheduled";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found | Blissful Place Residences",
      description: "The requested article could not be found.",
    };
  }

  return buildPublicBlogPostMetadata({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    ogImageUrl: post.ogImageUrl,
    featuredImageUrl: post.featuredImageUrl,
    canonicalUrl: post.canonicalUrl,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const lexicalContent = resolvePublicLexicalContentState(post.content);
  const paragraphs = extractLexicalParagraphs(lexicalContent);
  const intro = resolvePublicBlogIntro(post.excerpt, paragraphs);

  return (
    <main className="blog-page">
      <SiteHeader />

      <article className="container blog-post-shell">
        <Link href="/blog" className="blog-read-link">
          &larr; Back to Blog
        </Link>

        <header className="blog-post-header">
          <p className="section-subtitle">Insights Journal</p>
          <h1 className="serif blog-post-title">{post.title}</h1>
          <p className="blog-post-meta">
            {formatPublishedDate(post.publishedAt)}
            {post.categories[0] ? ` | ${post.categories[0].title}` : ""}
            {post.authorName ? ` | By ${post.authorName}` : ""}
          </p>
          {intro ? <p className="blog-description">{intro}</p> : null}
        </header>

        {hasRenderableBlogImageCandidate(post.featuredImageUrl) ? (
          <div className="blog-post-image-wrap">
            <SafeBlogImage
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              sizes="(max-width: 900px) 100vw, 900px"
              priority
            />
          </div>
        ) : null}

        <section className="blog-post-content" aria-label="Article content">
          {lexicalContent ? (
            <RichText className="blog-post-richtext" data={lexicalContent} />
          ) : (
            <p>
              This article was published without supported rich content. Please use the editor formatting tools in CMS
              and republish to display headings, lists, and emphasis properly.
            </p>
          )}
        </section>

        <section className="blog-post-cta">
          <h2 className="serif">Need tailored support for your stay?</h2>
          <div className="blog-empty-actions">
            <Link href="/contact" className="btn btn-outline-white">
              Make an Inquiry
            </Link>
            <Link href="/book" className="btn btn-primary">
              Book Your Stay
            </Link>
          </div>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
