import {
  mapPublicBlogPostDetail,
  mapPublicBlogPostSummary,
  type PublicBlogPostDetail,
  type PublicBlogPostSummary,
} from "@/server/cms/blog-public-mappers";

export interface BlogContentRecordIssue {
  operation: "findPublishedBlogPostBySlug" | "listPublishedBlogPosts";
  issue: string;
  index: number;
  error?: unknown;
}

function reportIssue(issueReporter: ((issue: BlogContentRecordIssue) => void) | undefined, issue: BlogContentRecordIssue): void {
  issueReporter?.(issue);
}

export function mapPublishedBlogPostSummariesFromDocs(
  docs: unknown,
  issueReporter?: (issue: BlogContentRecordIssue) => void
): PublicBlogPostSummary[] {
  if (!Array.isArray(docs)) {
    return [];
  }

  const summaries: PublicBlogPostSummary[] = [];

  docs.forEach((doc, index) => {
    try {
      const entry = mapPublicBlogPostSummary(doc);

      if (entry) {
        summaries.push(entry);
        return;
      }

      reportIssue(issueReporter, {
        operation: "listPublishedBlogPosts",
        issue: "summary mapping returned null",
        index,
      });
    } catch (error) {
      reportIssue(issueReporter, {
        operation: "listPublishedBlogPosts",
        issue: "summary mapping threw",
        index,
        error,
      });
    }
  });

  return summaries;
}

export function resolvePublishedBlogPostDetailFromDocs(
  docs: unknown,
  issueReporter?: (issue: BlogContentRecordIssue) => void
): PublicBlogPostDetail | null {
  if (!Array.isArray(docs)) {
    return null;
  }

  for (const [index, doc] of docs.entries()) {
    try {
      const entry = mapPublicBlogPostDetail(doc);

      if (entry) {
        return entry;
      }

      reportIssue(issueReporter, {
        operation: "findPublishedBlogPostBySlug",
        issue: "detail mapping returned null",
        index,
      });
    } catch (error) {
      reportIssue(issueReporter, {
        operation: "findPublishedBlogPostBySlug",
        issue: "detail mapping threw",
        index,
        error,
      });
    }
  }

  return null;
}
