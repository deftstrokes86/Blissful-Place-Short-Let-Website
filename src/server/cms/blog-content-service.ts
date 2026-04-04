import { getCmsPayload } from "@/cms/payload";
import {
  mapPublicBlogPostDetail,
  mapPublicBlogPostSummary,
  type PublicBlogPostDetail,
  type PublicBlogPostSummary,
} from "@/server/cms/blog-public-mappers";
import { buildPublishedBlogDetailQuery, buildPublishedBlogListQuery } from "@/server/cms/blog-public-query";

function reportBlogContentError(
  operation: "findPublishedBlogPostBySlug" | "listPublishedBlogPosts",
  error: unknown,
  context: Record<string, number | string>
): void {
  console.error("[cms/blog-content-service] Payload blog query failed.", {
    operation,
    ...context,
    error,
  });
}

export async function listPublishedBlogPosts(limit = 20): Promise<PublicBlogPostSummary[]> {
  try {
    const payload = await getCmsPayload();
    const result = await payload.find({
      // Public pages fetch published posts explicitly without exposing CMS collection reads.
      ...buildPublishedBlogListQuery(limit),
      overrideAccess: true,
    });

    return result.docs
      .map((doc) => mapPublicBlogPostSummary(doc))
      .filter((entry): entry is PublicBlogPostSummary => Boolean(entry));
  } catch (error) {
    reportBlogContentError("listPublishedBlogPosts", error, { limit });
    return [];
  }
}

export async function findPublishedBlogPostBySlug(slug: string): Promise<PublicBlogPostDetail | null> {
  const detailQuery = buildPublishedBlogDetailQuery(slug);

  if (!detailQuery) {
    return null;
  }

  try {
    const payload = await getCmsPayload();
    const result = await payload.find({
      // Public pages fetch published posts explicitly without exposing CMS collection reads.
      ...detailQuery,
      overrideAccess: true,
    });

    if (result.docs.length === 0) {
      return null;
    }

    return mapPublicBlogPostDetail(result.docs[0]);
  } catch (error) {
    reportBlogContentError("findPublishedBlogPostBySlug", error, { slug });
    return null;
  }
}
