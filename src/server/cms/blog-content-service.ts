import { getCmsPayload } from "@/cms/payload";
import type { BlogContentRecordIssue } from "@/server/cms/blog-content-transformers";
import {
  mapPublishedBlogPostSummariesFromDocs,
  resolvePublishedBlogPostDetailFromDocs,
} from "@/server/cms/blog-content-transformers";
import type { PublicBlogPostDetail, PublicBlogPostSummary } from "@/server/cms/blog-public-mappers";
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

function reportMalformedBlogRecord(issue: BlogContentRecordIssue): void {
  console.warn("[cms/blog-content-service] Ignoring malformed blog payload record.", {
    operation: issue.operation,
    issue: issue.issue,
    index: issue.index,
    error: issue.error,
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

    return mapPublishedBlogPostSummariesFromDocs(result.docs, reportMalformedBlogRecord);
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

    return resolvePublishedBlogPostDetailFromDocs(result.docs, reportMalformedBlogRecord);
  } catch (error) {
    reportBlogContentError("findPublishedBlogPostBySlug", error, { slug });
    return null;
  }
}
