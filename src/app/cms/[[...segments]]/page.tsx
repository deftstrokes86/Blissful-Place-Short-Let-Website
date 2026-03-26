import { RootPage } from "@payloadcms/next/views";

import { cmsImportMap } from "@/cms/payload";
import payloadConfig from "@/cms/payload.config";

interface CmsPageProps {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function normalizeSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" || Array.isArray(value)) {
      normalized[key] = value;
    }
  }

  return normalized;
}

export default async function CmsPage({ params, searchParams }: CmsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = normalizeSearchParams(await searchParams);

  return RootPage({
    config: Promise.resolve(payloadConfig),
    importMap: cmsImportMap,
    params: Promise.resolve({
      segments: resolvedParams.segments ?? [],
    }),
    searchParams: Promise.resolve(resolvedSearchParams),
  });
}
