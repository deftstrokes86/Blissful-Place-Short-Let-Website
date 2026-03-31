import { getCmsPayload } from "@/cms/payload";
import { mapPublicCmsPageDetail, type CmsPageDetail } from "@/server/cms/cms-page-mappers";
import { buildPublishedCmsPageDetailQuery } from "@/server/cms/cms-page-query";

export async function findPublishedCmsPageBySlug(slug: string): Promise<CmsPageDetail | null> {
  const detailQuery = buildPublishedCmsPageDetailQuery(slug);

  if (!detailQuery) {
    return null;
  }

  const payload = await getCmsPayload();

  try {
    const result = await payload.find({
      // Public routes fetch only explicitly-published CMS pages.
      ...detailQuery,
      overrideAccess: true,
    });

    if (result.docs.length === 0) {
      return null;
    }

    return mapPublicCmsPageDetail(result.docs[0]);
  } catch {
    return null;
  }
}
