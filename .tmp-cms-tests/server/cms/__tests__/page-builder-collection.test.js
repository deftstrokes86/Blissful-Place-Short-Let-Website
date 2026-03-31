"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const page_builder_model_1 = require("../page-builder-model");
function readSource(relativePath) {
    return (0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), relativePath), "utf8");
}
async function testPageBuilderCollectionShape() {
    const source = readSource("src/cms/collections/CmsPages.ts");
    strict_1.default.ok(source.includes('slug: "cms-pages"'));
    strict_1.default.ok(source.includes('name: "layout"'));
    strict_1.default.ok(source.includes('type: "blocks"'));
    strict_1.default.ok(source.includes('slug: "hero"'));
    strict_1.default.ok(source.includes('slug: "richText"'));
    strict_1.default.ok(source.includes('slug: "featureGrid"'));
    strict_1.default.ok(source.includes('slug: "mediaSplit"'));
    strict_1.default.ok(source.includes('slug: "ctaStrip"'));
    strict_1.default.ok(source.includes('name: "status"'));
    strict_1.default.ok(source.includes('name: "publishedAt"'));
    strict_1.default.ok(source.includes('name: "metaTitle"'));
    strict_1.default.ok(source.includes('name: "metaDescription"'));
    strict_1.default.ok(source.includes('versions: {'));
    strict_1.default.ok(source.includes('drafts: true'));
}
async function testPageBuilderRichTextToolbarConfig() {
    const source = readSource("src/cms/collections/CmsPages.ts");
    strict_1.default.ok(source.includes("FixedToolbarFeature"));
    strict_1.default.ok(source.includes("lexicalEditor({"));
    strict_1.default.ok(source.includes("features: ({ defaultFeatures }) => ["));
    strict_1.default.ok(source.includes('name: "body"'));
    strict_1.default.ok(source.includes("...defaultFeatures"));
}
async function testPageBuilderSlugAndStatusHelpers() {
    strict_1.default.equal((0, page_builder_model_1.normalizePageSlug)("  About Blissful Place  "), "about-blissful-place");
    strict_1.default.equal((0, page_builder_model_1.resolvePageSlug)(" custom-page ", "ignored"), "custom-page");
    strict_1.default.equal((0, page_builder_model_1.resolvePageSlug)("", "Contact Us"), "contact-us");
    strict_1.default.equal((0, page_builder_model_1.coercePageStatus)("draft"), "draft");
    strict_1.default.equal((0, page_builder_model_1.coercePageStatus)("published"), "published");
    strict_1.default.equal((0, page_builder_model_1.coercePageStatus)("archived"), null);
    strict_1.default.equal((0, page_builder_model_1.shouldAutoSetPagePublishedAt)("published", null), true);
    strict_1.default.equal((0, page_builder_model_1.shouldAutoSetPagePublishedAt)("published", "2026-03-26T00:00:00.000Z"), false);
    strict_1.default.equal((0, page_builder_model_1.shouldAutoSetPagePublishedAt)("draft", null), false);
}
async function testPayloadConfigRegistersPageBuilderCollection() {
    const source = readSource("src/cms/payload.config.ts");
    strict_1.default.ok(source.includes("CmsPagesCollection"));
    strict_1.default.ok(source.includes("CmsPagesCollection,"));
}
async function run() {
    await testPageBuilderCollectionShape();
    await testPageBuilderRichTextToolbarConfig();
    await testPageBuilderSlugAndStatusHelpers();
    await testPayloadConfigRegistersPageBuilderCollection();
    console.log("page-builder-collection: ok");
}
void run();
