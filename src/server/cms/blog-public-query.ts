export interface PublishedBlogListQuery {
  collection: "blog-posts";
  where: {
    status: {
      equals: "published";
    };
  };
  sort: "-publishedAt";
  limit: number;
  depth: 1;
}

export interface PublishedBlogDetailQuery {
  collection: "blog-posts";
  where: {
    and: [
      {
        slug: {
          equals: string;
        };
      },
      {
        status: {
          equals: "published";
        };
      },
    ];
  };
  limit: 1;
  depth: 2;
}

export function normalizePublicBlogSlugInput(slug: string): string {
  return slug.trim().toLowerCase();
}

export function buildPublishedBlogListQuery(limit: number): PublishedBlogListQuery {
  return {
    collection: "blog-posts",
    where: {
      status: {
        equals: "published",
      },
    },
    sort: "-publishedAt",
    limit,
    depth: 1,
  };
}

export function buildPublishedBlogDetailQuery(slug: string): PublishedBlogDetailQuery | null {
  const normalizedSlug = normalizePublicBlogSlugInput(slug);

  if (!normalizedSlug) {
    return null;
  }

  return {
    collection: "blog-posts",
    where: {
      and: [
        {
          slug: {
            equals: normalizedSlug,
          },
        },
        {
          status: {
            equals: "published",
          },
        },
      ],
    },
    limit: 1,
    depth: 2,
  };
}
