"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const cms_page_mappers_1 = require("../cms-page-mappers");
const cms_page_query_1 = require("../cms-page-query");
function readSource(relativePath) {
    return (0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), relativePath), "utf8");
}
async function testPublishedCmsPageQueryBuilder() {
    strict_1.default.equal((0, cms_page_query_1.normalizePublicCmsPageSlugInput)("  About Blissful Place  "), "about-blissful-place");
    const query = (0, cms_page_query_1.buildPublishedCmsPageDetailQuery)("about");
    strict_1.default.ok(query);
    strict_1.default.equal(query === null || query === void 0 ? void 0 : query.collection, "cms-pages");
    strict_1.default.equal(query === null || query === void 0 ? void 0 : query.limit, 1);
    strict_1.default.equal(query === null || query === void 0 ? void 0 : query.where.and[0].slug.equals, "about");
    strict_1.default.equal(query === null || query === void 0 ? void 0 : query.where.and[1].status.equals, "published");
    strict_1.default.equal((0, cms_page_query_1.buildPublishedCmsPageDetailQuery)("   "), null);
}
async function testPageMapperPreservesRichTextBlockBody() {
    var _a;
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
    const mapped = (0, cms_page_mappers_1.mapPublicCmsPageDetail)({
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
    strict_1.default.ok(mapped);
    strict_1.default.equal((_a = mapped === null || mapped === void 0 ? void 0 : mapped.layout[0]) === null || _a === void 0 ? void 0 : _a.blockType, "richText");
    strict_1.default.deepEqual((mapped === null || mapped === void 0 ? void 0 : mapped.layout[0]).body, lexicalBody);
}
async function testPublicCmsPageRouteAndRendererWiring() {
    const routePath = "src/app/(site)/pages/[slug]/page.tsx";
    const rendererPath = "src/components/cms/CmsPublicPageRenderer.tsx";
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), routePath)), true);
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), rendererPath)), true);
    const routeSource = readSource(routePath);
    const rendererSource = readSource(rendererPath);
    strict_1.default.ok(routeSource.includes("findPublishedCmsPageBySlug"));
    strict_1.default.ok(routeSource.includes("CmsPublicPageRenderer"));
    strict_1.default.ok(rendererSource.includes("CmsRichTextBlock"));
    strict_1.default.ok(rendererSource.includes('case "richText"'));
    strict_1.default.ok(rendererSource.includes('case "mediaSplit"'));
}
async function run() {
    await testPublishedCmsPageQueryBuilder();
    await testPageMapperPreservesRichTextBlockBody();
    await testPublicCmsPageRouteAndRendererWiring();
    console.log("cms-page-public-routes: ok");
}
void run();
