# Blog System

## Purpose
Define the blog system scope, editorial workflow, and public delivery behavior for SEO growth and trust-building content.

## Blog Route Surface
Public routes:
- `/blog` (listing/discovery)
- `/blog/[slug]` (post detail)

Internal management route:
- `/cms` (editorial management via Payload)

## Blog Scope (Phase)

### Required
1. Posts
- Title
- Slug
- Excerpt
- Rich content/body
- Status (`draft`, `published`)
- Publish datetime

2. Categories
- Name/title
- Slug
- Optional description

3. Authors
- Linked internal CMS user (author/editor)

4. Media
- Featured image / cover image
- Reusable media library assets

5. SEO fields
- SEO title
- SEO description
- Optional OG/social metadata fields (future-safe)

### Optional
1. Tags
- Optional in this phase
- Can be enabled if needed for content grouping and SEO structure

## Editorial Workflow
1. Create draft post in `/cms`
2. Assign category/categories
3. Add media and SEO metadata
4. Review content quality and factual accuracy
5. Publish
6. Post appears on `/blog` and `/blog/[slug]`

## Publishing Rules
1. Public routes show only `published` posts
2. Draft posts stay internal in `/cms`
3. Slugs must be unique and clean
4. Publication timestamps should be explicit for sorting and freshness signals

## SEO Relevance
The blog is a strategic SEO growth surface.

SEO intent:
1. Capture informational and local hospitality search demand
2. Build trust through practical and clear content
3. Support internal linking into booking and inquiry pages

SEO requirements in model:
1. Slug
2. Meta title
3. Meta description
4. Structured publishing status workflow

## Content Quality Direction
1. Human, useful, hospitality-relevant writing
2. Avoid generic filler and thin pages
3. Prefer practical guidance tied to real guest needs
4. Keep claims accurate and non-exaggerated

## Integration With Main Site
1. Header/footer should include blog navigation where appropriate
2. Blog pages should include clear but restrained CTAs to:
- `/book`
- `/availability`
- `/contact`

3. Blog should not feel disconnected from overall brand style

## Non-Goals (Blog)
1. No public user-generated posting
2. No comments/discussion platform in this phase
3. No marketing automation suite in this phase
4. No full newsletter platform in this phase

## Implementation Readiness Checklist
1. Collections defined for posts/categories/media/authors
2. Access rules enforce draft visibility boundaries
3. Public blog pages read published content only
4. SEO metadata fields included in post schema
5. Route behavior documented and stable
