import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { mapPublicCmsPageDetail } from "../cms-page-mappers";
import { buildPublishedCmsPageDetailQuery, normalizePublicCmsPageSlugInput } from "../cms-page-query";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testPublishedCmsPageQueryBuilder(): Promise<void> {
  assert.equal(normalizePublicCmsPageSlugInput("  About Blissful Place  "), "about-blissful-place");

  const query = buildPublishedCmsPageDetailQuery("about");

  assert.ok(query);
  assert.equal(query?.collection, "cms-pages");
  assert.equal(query?.limit, 1);
  assert.equal(query?.where.and[0].slug.equals, "about");
  assert.equal(query?.where.and[1].status.equals, "published");

  assert.equal(buildPublishedCmsPageDetailQuery("   "), null);
}

async function testPageMapperPreservesRichTextBlockBody(): Promise<void> {
  const lexicalBody = {
    root: {
      type: "root",
      version: 1,
      children: [
        {
          type: "paragraph",
          version: 1,
          children: [
            {
              type: "text",
              version: 1,
              text: "Body copy",
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
            },
          ],
          direction: null,
          format: "",
          indent: 0,
          textFormat: 0,
          textStyle: "",
        },
      ],
      direction: null,
      format: "",
      indent: 0,
    },
  };

  const mapped = mapPublicCmsPageDetail({
    id: 1,
    title: "About",
    slug: "about",
    status: "published",
    layout: [
      {
        id: "block-1",
        blockType: "richText",
        heading: "Heading",
        body: lexicalBody,
      },
    ],
  });

  assert.ok(mapped);
  assert.equal(mapped?.layout[0]?.blockType, "richText");
  assert.deepEqual((mapped?.layout[0] as { body: unknown }).body, lexicalBody);
}

async function testPublicCmsPageRouteAndRendererWiring(): Promise<void> {
  const routePath = "src/app/(site)/pages/[slug]/page.tsx";
  const rendererPath = "src/components/cms/CmsPublicPageRenderer.tsx";

  assert.equal(existsSync(join(process.cwd(), routePath)), true);
  assert.equal(existsSync(join(process.cwd(), rendererPath)), true);

  const routeSource = readSource(routePath);
  const rendererSource = readSource(rendererPath);

  assert.ok(routeSource.includes("findPublishedCmsPageBySlug"));
  assert.ok(routeSource.includes("CmsPublicPageRenderer"));
  assert.ok(rendererSource.includes("CmsRichTextBlock"));
  assert.ok(rendererSource.includes('case "richText"'));
  assert.ok(rendererSource.includes('case "mediaSplit"'));
}

async function run(): Promise<void> {
  await testPublishedCmsPageQueryBuilder();
  await testPageMapperPreservesRichTextBlockBody();
  await testPublicCmsPageRouteAndRendererWiring();

  console.log("cms-page-public-routes: ok");
}

void run();

