"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const blog_content_model_1 = require("../blog-content-model");
const cms_access_1 = require("../cms-access");
const access_controls_1 = require("../../../cms/access-controls");
function readSource(relativePath) {
    return (0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), relativePath), "utf8");
}
function evaluateBlogMediaReadAccess(args) {
    return (0, access_controls_1.blogMediaPublicReadAccess)(args);
}
async function testBlogPostCollectionFieldShape() {
    const source = readSource("src/cms/collections/BlogPosts.ts");
    const requiredFields = [
        'name: "title"',
        'name: "slug"',
        'name: "excerpt"',
        'name: "content"',
        'name: "featuredImage"',
        'name: "author"',
        'name: "categories"',
        'name: "status"',
        'name: "publishedAt"',
        'name: "metaTitle"',
        'name: "metaDescription"',
        'name: "ogImage"',
        'name: "canonicalUrl"',
        'name: "tags"',
    ];
    for (const fieldToken of requiredFields) {
        strict_1.default.ok(source.includes(fieldToken), `Expected blog posts field token: ${fieldToken}`);
    }
}
async function testBlogSlugBehavior() {
    strict_1.default.equal((0, blog_content_model_1.normalizeBlogSlug)("  Hello, Lagos! Private Tour  "), "hello-lagos-private-tour");
    strict_1.default.equal((0, blog_content_model_1.normalizeBlogSlug)("Already-clean-slug"), "already-clean-slug");
    strict_1.default.equal((0, blog_content_model_1.normalizeBlogSlug)("---Mixed___Spacing***"), "mixed-spacing");
}
async function testBlogStatusHelpers() {
    strict_1.default.equal((0, blog_content_model_1.coerceBlogPostStatus)("draft"), "draft");
    strict_1.default.equal((0, blog_content_model_1.coerceBlogPostStatus)("published"), "published");
    strict_1.default.equal((0, blog_content_model_1.coerceBlogPostStatus)("archived"), null);
    strict_1.default.equal((0, blog_content_model_1.shouldAutoSetPublishedAt)("published", null), true);
    strict_1.default.equal((0, blog_content_model_1.shouldAutoSetPublishedAt)("published", "2026-01-01T00:00:00.000Z"), false);
    strict_1.default.equal((0, blog_content_model_1.shouldAutoSetPublishedAt)("draft", null), false);
}
async function testBlogContentNormalization() {
    const existingContent = {
        root: {
            type: "root",
            children: [
                {
                    type: "paragraph",
                    children: [],
                    direction: null,
                    format: "",
                    indent: 0,
                    version: 1,
                },
            ],
            direction: null,
            format: "",
            indent: 0,
            version: 1,
        },
    };
    strict_1.default.equal((0, blog_content_model_1.resolveBlogContent)(existingContent, "Excerpt", "Title"), existingContent);
    const fromString = (0, blog_content_model_1.resolveBlogContent)("Plain body text", "Excerpt", "Title");
    strict_1.default.ok(fromString);
    strict_1.default.equal(fromString.root.type, "root");
    const fromExcerpt = (0, blog_content_model_1.resolveBlogContent)(null, "Excerpt fallback", "Title");
    strict_1.default.ok(fromExcerpt);
    const fromTitle = (0, blog_content_model_1.resolveBlogContent)(null, null, "Title fallback");
    strict_1.default.ok(fromTitle);
    const unresolved = (0, blog_content_model_1.resolveBlogContent)(null, null, null);
    strict_1.default.equal(unresolved, null);
}
async function testBlogCmsAccessExpectations() {
    strict_1.default.equal((0, cms_access_1.canManageBlog)("admin"), true);
    strict_1.default.equal((0, cms_access_1.canManageBlog)("blog_manager"), true);
    strict_1.default.equal((0, cms_access_1.canManageBlog)("author"), false);
    strict_1.default.equal((0, cms_access_1.canManageBlog)("inventory_manager"), false);
    strict_1.default.equal((0, cms_access_1.canReadBlogCollections)("inventory_manager"), false);
    strict_1.default.equal((0, cms_access_1.canReadBlogCollections)("author"), true);
    strict_1.default.equal((0, cms_access_1.canReadBlogCollections)("blog_manager"), true);
    strict_1.default.equal((0, cms_access_1.canReadBlogCollections)(null), false);
    strict_1.default.equal((0, cms_access_1.buildBlogReadAccessConstraint)("inventory_manager", "inv-1"), false);
    strict_1.default.equal((0, cms_access_1.buildBlogReadAccessConstraint)(null, null), false);
}
async function testBlogSupportCollectionsExist() {
    const categoriesSource = readSource("src/cms/collections/BlogCategories.ts");
    const mediaSource = readSource("src/cms/collections/BlogMedia.ts");
    const tagsSource = readSource("src/cms/collections/BlogTags.ts");
    strict_1.default.ok(categoriesSource.includes('slug: "blog-categories"'));
    strict_1.default.ok(mediaSource.includes('slug: "blog-media"'));
    strict_1.default.ok(mediaSource.includes("blogMediaPublicReadAccess"));
    strict_1.default.ok(tagsSource.includes('slug: "blog-tags"'));
}
async function testBlogMediaFileReadBehavior() {
    strict_1.default.equal(evaluateBlogMediaReadAccess({
        req: {
            path: "/cms/api/blog-media/file/image.jpg",
        },
    }), true);
    strict_1.default.equal(evaluateBlogMediaReadAccess({
        req: {
            path: "/cms/api/blog-media",
        },
    }), false);
    strict_1.default.equal(evaluateBlogMediaReadAccess({
        req: {
            path: "/cms/api/blog-media",
            user: {
                id: "manager-1",
                role: "blog_manager",
                collection: "cms-users",
            },
        },
    }), true);
}
async function run() {
    await testBlogPostCollectionFieldShape();
    await testBlogSlugBehavior();
    await testBlogStatusHelpers();
    await testBlogContentNormalization();
    await testBlogCmsAccessExpectations();
    await testBlogSupportCollectionsExist();
    await testBlogMediaFileReadBehavior();
    console.log("blog-collections: ok");
}
void run();
