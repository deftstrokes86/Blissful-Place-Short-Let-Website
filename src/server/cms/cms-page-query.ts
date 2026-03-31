import { normalizePageSlug } from "./page-builder-model";

export interface PublishedCmsPageDetailQuery {
  collection: "cms-pages";
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
  depth: 3;
}

export function normalizePublicCmsPageSlugInput(slug: string): string {
  return normalizePageSlug(slug.trim());
}

export function buildPublishedCmsPageDetailQuery(slug: string): PublishedCmsPageDetailQuery | null {
  const normalizedSlug = normalizePublicCmsPageSlugInput(slug);

  if (!normalizedSlug) {
    return null;
  }

  return {
    collection: "cms-pages",
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
    depth: 3,
  };
}
