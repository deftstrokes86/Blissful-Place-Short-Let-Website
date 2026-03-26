import { getCmsPayload } from "@/cms/payload";
import {
  mapPublicBlogPostDetail,
  mapPublicBlogPostSummary,
  type PublicBlogPostDetail,
  type PublicBlogPostSummary,
} from "@/server/cms/blog-public-mappers";
import { buildPublishedBlogDetailQuery, buildPublishedBlogListQuery } from "@/server/cms/blog-public-query";

export async function listPublishedBlogPosts(limit = 20): Promise<PublicBlogPostSummary[]> {
  const payload = await getCmsPayload();

  try {
    const result = await payload.find({
      // Public pages fetch published posts explicitly without exposing CMS collection reads.
      ...buildPublishedBlogListQuery(limit),
      overrideAccess: true,
    });

    return result.docs
      .map((doc) => mapPublicBlogPostSummary(doc))
      .filter((entry): entry is PublicBlogPostSummary => Boolean(entry));
  } catch {
    return [];
  }
}

export async function findPublishedBlogPostBySlug(slug: string): Promise<PublicBlogPostDetail | null> {
  const detailQuery = buildPublishedBlogDetailQuery(slug);

  if (!detailQuery) {
    return null;
  }

  const payload = await getCmsPayload();

  try {
    const result = await payload.find({
      // Public pages fetch published posts explicitly without exposing CMS collection reads.
      ...detailQuery,
      overrideAccess: true,
    });

    if (result.docs.length === 0) {
      return null;
    }

    return mapPublicBlogPostDetail(result.docs[0]);
  } catch {
    return null;
  }
}
