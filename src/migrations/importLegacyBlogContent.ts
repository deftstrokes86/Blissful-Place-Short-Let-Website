import fs from "node:fs";
import path from "node:path";

import type { Payload, PayloadRequest } from "payload";

import legacyBlogContent from "./data/legacy-blog-content.json";

type CmsRole = "admin" | "inventory_manager" | "blog_manager" | "author";
type BlogPostStatus = "draft" | "published";
type DocumentId = number | string;

interface LegacyAuthorRecord {
  key: string;
  name: string;
  email: string;
  role: CmsRole;
}

interface LegacyCategoryRecord {
  title: string;
  slug: string;
  description: string | null;
}

interface LegacyTagRecord {
  title: string;
  slug: string;
  description: string | null;
}

interface LegacyMediaRecord {
  alt: string;
  caption: string | null;
  filename: string;
}

interface LegacyPostRecord {
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  featuredImageFilename: string | null;
  authorKey: string | null;
  categories: string[];
  tags: string[];
  status: BlogPostStatus;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageFilename: string | null;
  canonicalUrl: string | null;
}

interface LegacyBlogSnapshot {
  authors: LegacyAuthorRecord[];
  categories: LegacyCategoryRecord[];
  tags: LegacyTagRecord[];
  media: LegacyMediaRecord[];
  posts: LegacyPostRecord[];
}

const legacySnapshot = legacyBlogContent as LegacyBlogSnapshot;

function readDocumentId(value: unknown, context: string): DocumentId {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  throw new Error(`Expected an id for ${context}.`);
}

function buildEqualsWhere(field: string, value: string): Record<string, { equals: string }> {
  return {
    [field]: {
      equals: value,
    },
  };
}

async function findOneByField(
  payload: Payload,
  req: PayloadRequest,
  collection: "blog-categories" | "blog-media" | "blog-posts" | "blog-tags" | "cms-users",
  field: string,
  value: string
): Promise<Record<string, unknown> | null> {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: buildEqualsWhere(field, value) as never,
  });

  const [firstDoc] = result.docs as Record<string, unknown>[];
  return firstDoc ?? null;
}

function resolveMediaFilePath(filename: string): string {
  const filePath = path.resolve(process.cwd(), "media", filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Legacy blog media file is missing: ${filePath}`);
  }

  return filePath;
}

async function upsertAuthor(
  payload: Payload,
  req: PayloadRequest,
  author: LegacyAuthorRecord
): Promise<DocumentId> {
  const existing = await findOneByField(payload, req, "cms-users", "email", author.email);

  if (existing) {
    const updated = await payload.update({
      id: readDocumentId(existing.id, `existing author ${author.email}`),
      collection: "cms-users",
      data: {
        name: author.name,
        role: author.role,
      },
      overrideAccess: true,
      req,
    });

    return readDocumentId(updated.id, `updated author ${author.email}`);
  }

  const created = await payload.create({
    collection: "cms-users",
    data: {
      email: author.email,
      name: author.name,
      password: `legacy-import-${author.key}-not-for-login`,
      role: author.role,
    },
    disableVerificationEmail: true,
    overrideAccess: true,
    req,
  });

  return readDocumentId(created.id, `created author ${author.email}`);
}

async function upsertCategory(
  payload: Payload,
  req: PayloadRequest,
  category: LegacyCategoryRecord
): Promise<DocumentId> {
  const existing = await findOneByField(payload, req, "blog-categories", "slug", category.slug);

  if (existing) {
    const updated = await payload.update({
      id: readDocumentId(existing.id, `existing category ${category.slug}`),
      collection: "blog-categories",
      data: {
        description: category.description,
        slug: category.slug,
        title: category.title,
      },
      overrideAccess: true,
      req,
    });

    return readDocumentId(updated.id, `updated category ${category.slug}`);
  }

  const created = await payload.create({
    collection: "blog-categories",
    data: {
      description: category.description,
      slug: category.slug,
      title: category.title,
    },
    overrideAccess: true,
    req,
  });

  return readDocumentId(created.id, `created category ${category.slug}`);
}

async function upsertTag(
  payload: Payload,
  req: PayloadRequest,
  tag: LegacyTagRecord
): Promise<DocumentId> {
  const existing = await findOneByField(payload, req, "blog-tags", "slug", tag.slug);

  if (existing) {
    const updated = await payload.update({
      id: readDocumentId(existing.id, `existing tag ${tag.slug}`),
      collection: "blog-tags",
      data: {
        description: tag.description,
        slug: tag.slug,
        title: tag.title,
      },
      overrideAccess: true,
      req,
    });

    return readDocumentId(updated.id, `updated tag ${tag.slug}`);
  }

  const created = await payload.create({
    collection: "blog-tags",
    data: {
      description: tag.description,
      slug: tag.slug,
      title: tag.title,
    },
    overrideAccess: true,
    req,
  });

  return readDocumentId(created.id, `created tag ${tag.slug}`);
}

async function upsertMedia(
  payload: Payload,
  req: PayloadRequest,
  media: LegacyMediaRecord
): Promise<DocumentId> {
  const filePath = resolveMediaFilePath(media.filename);
  const existing = await findOneByField(payload, req, "blog-media", "filename", media.filename);

  if (existing) {
    const updated = await payload.update({
      id: readDocumentId(existing.id, `existing media ${media.filename}`),
      collection: "blog-media",
      data: {
        alt: media.alt,
        caption: media.caption,
      },
      filePath,
      overwriteExistingFiles: true,
      overrideAccess: true,
      req,
    });

    return readDocumentId(updated.id, `updated media ${media.filename}`);
  }

  const created = await payload.create({
    collection: "blog-media",
    data: {
      alt: media.alt,
      caption: media.caption,
    },
    filePath,
    overwriteExistingFiles: true,
    overrideAccess: true,
    req,
  });

  return readDocumentId(created.id, `created media ${media.filename}`);
}

async function upsertPost(
  payload: Payload,
  req: PayloadRequest,
  post: LegacyPostRecord,
  authorIdsByKey: Map<string, DocumentId>,
  categoryIdsBySlug: Map<string, DocumentId>,
  mediaIdsByFilename: Map<string, DocumentId>,
  tagIdsBySlug: Map<string, DocumentId>
): Promise<DocumentId> {
  const authorId = post.authorKey ? authorIdsByKey.get(post.authorKey) : undefined;

  if (!authorId) {
    throw new Error(`Missing migrated author for blog post ${post.slug}.`);
  }

  const categoryIds = post.categories.map((slug) => {
    const categoryId = categoryIdsBySlug.get(slug);

    if (!categoryId) {
      throw new Error(`Missing migrated category ${slug} for blog post ${post.slug}.`);
    }

    return categoryId;
  });

  const tagIds = post.tags.map((slug) => {
    const tagId = tagIdsBySlug.get(slug);

    if (!tagId) {
      throw new Error(`Missing migrated tag ${slug} for blog post ${post.slug}.`);
    }

    return tagId;
  });

  const featuredImageId = post.featuredImageFilename
    ? mediaIdsByFilename.get(post.featuredImageFilename) ?? null
    : null;
  const ogImageId = post.ogImageFilename ? mediaIdsByFilename.get(post.ogImageFilename) ?? null : null;
  const draft = post.status !== "published";
  const data = {
    author: authorId,
    canonicalUrl: post.canonicalUrl,
    categories: categoryIds,
    content: post.content,
    excerpt: post.excerpt,
    featuredImage: featuredImageId,
    metaDescription: post.metaDescription,
    metaTitle: post.metaTitle,
    ogImage: ogImageId,
    publishedAt: post.publishedAt,
    slug: post.slug,
    status: post.status,
    tags: tagIds,
    title: post.title,
  };

  const existing = await findOneByField(payload, req, "blog-posts", "slug", post.slug);

  if (existing) {
    const updated = await payload.update({
      id: readDocumentId(existing.id, `existing blog post ${post.slug}`),
      collection: "blog-posts",
      data,
      draft,
      overrideAccess: true,
      req,
    });

    return readDocumentId(updated.id, `updated blog post ${post.slug}`);
  }

  const created = await payload.create({
    collection: "blog-posts",
    data,
    draft,
    overrideAccess: true,
    req,
  });

  return readDocumentId(created.id, `created blog post ${post.slug}`);
}

export async function importLegacyBlogContent(payload: Payload, req: PayloadRequest): Promise<void> {
  const authorIdsByKey = new Map<string, DocumentId>();
  const categoryIdsBySlug = new Map<string, DocumentId>();
  const mediaIdsByFilename = new Map<string, DocumentId>();
  const tagIdsBySlug = new Map<string, DocumentId>();

  for (const author of legacySnapshot.authors) {
    const authorId = await upsertAuthor(payload, req, author);
    authorIdsByKey.set(author.key, authorId);
  }

  for (const category of legacySnapshot.categories) {
    const categoryId = await upsertCategory(payload, req, category);
    categoryIdsBySlug.set(category.slug, categoryId);
  }

  for (const tag of legacySnapshot.tags) {
    const tagId = await upsertTag(payload, req, tag);
    tagIdsBySlug.set(tag.slug, tagId);
  }

  for (const media of legacySnapshot.media) {
    const mediaId = await upsertMedia(payload, req, media);
    mediaIdsByFilename.set(media.filename, mediaId);
  }

  for (const post of legacySnapshot.posts) {
    await upsertPost(payload, req, post, authorIdsByKey, categoryIdsBySlug, mediaIdsByFilename, tagIdsBySlug);
  }
}

export async function noopLegacyBlogContentRollback(): Promise<void> {
  // This import intentionally avoids destructive rollback because the content may have been edited after migration.
}
