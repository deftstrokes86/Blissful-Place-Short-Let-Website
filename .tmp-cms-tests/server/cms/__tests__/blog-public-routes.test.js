"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const blog_public_mappers_1 = require("../blog-public-mappers");
const blog_public_query_1 = require("../blog-public-query");
const blog_public_content_1 = require("../blog-public-content");
function readSource(relativePath) {
    return (0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), relativePath), "utf8");
}
function getFirstImageUrl(value) {
    if (Array.isArray(value) && value.length > 0) {
        const firstImage = value[0];
        if (typeof firstImage === "string") {
            return firstImage;
        }
        if (firstImage && typeof firstImage === "object" && "url" in firstImage) {
            const imageUrl = firstImage.url;
            return typeof imageUrl === "string" ? imageUrl : null;
        }
    }
    if (typeof value === "string") {
        return value;
    }
    return null;
}
async function testPublishedOnlyQueryBehavior() {
    const listQuery = (0, blog_public_query_1.buildPublishedBlogListQuery)(12);
    strict_1.default.equal(listQuery.collection, "blog-posts");
    strict_1.default.equal(listQuery.limit, 12);
    strict_1.default.equal(listQuery.depth, 1);
    strict_1.default.equal(listQuery.sort, "-publishedAt");
    strict_1.default.deepEqual(listQuery.where, {
        status: {
            equals: "published",
        },
    });
    const detailQuery = (0, blog_public_query_1.buildPublishedBlogDetailQuery)("  WELCOME-To-Lagos  ");
    strict_1.default.ok(detailQuery);
    if (!detailQuery) {
        throw new Error("Expected detail query for valid slug");
    }
    strict_1.default.equal(detailQuery.collection, "blog-posts");
    strict_1.default.equal(detailQuery.limit, 1);
    strict_1.default.equal(detailQuery.depth, 2);
    strict_1.default.deepEqual(detailQuery.where, {
        and: [
            {
                slug: {
                    equals: "welcome-to-lagos",
                },
            },
            {
                status: {
                    equals: "published",
                },
            },
        ],
    });
}
async function testSlugNormalizationAndInvalidHandling() {
    strict_1.default.equal((0, blog_public_query_1.normalizePublicBlogSlugInput)("  Hello-World  "), "hello-world");
    strict_1.default.equal((0, blog_public_query_1.normalizePublicBlogSlugInput)(""), "");
    strict_1.default.equal((0, blog_public_query_1.buildPublishedBlogDetailQuery)("   "), null);
}
async function testPublicMapperSupportsNumericCmsIds() {
    var _a;
    const summary = (0, blog_public_mappers_1.mapPublicBlogPostSummary)({
        id: 42,
        title: "Published Post",
        slug: "published-post",
        excerpt: "Short summary",
        publishedAt: "2026-03-26T19:00:00.000Z",
        categories: [
            {
                id: 10,
                title: "Guides",
                slug: "guides",
            },
        ],
        author: {
            id: 8,
            name: "Editorial Team",
        },
        featuredImage: {
            id: 7,
            url: "/media/post.jpg",
            alt: "Post image",
        },
    });
    strict_1.default.ok(summary);
    if (!summary) {
        throw new Error("Expected mapped summary for numeric CMS ids");
    }
    strict_1.default.equal(summary.id, "42");
    strict_1.default.equal((_a = summary.categories[0]) === null || _a === void 0 ? void 0 : _a.id, "10");
    strict_1.default.equal(summary.authorName, "Editorial Team");
    const detail = (0, blog_public_mappers_1.mapPublicBlogPostDetail)(Object.assign(Object.assign({}, summary), { content: {
            root: {
                children: [],
            },
        }, metaTitle: "Meta", metaDescription: "Description", ogImage: {
            id: 11,
            url: "/media/og.jpg",
            alt: "OG",
        } }));
    strict_1.default.ok(detail);
}
async function testPublicBlogServiceUsesExplicitPublishedServerQuery() {
    const source = readSource("src/server/cms/blog-content-service.ts");
    strict_1.default.ok(source.includes("overrideAccess: true"));
    strict_1.default.ok(source.includes("buildPublishedBlogListQuery"));
    strict_1.default.ok(source.includes("buildPublishedBlogDetailQuery"));
}
async function testBlogIndexEditorialLayoutStructure() {
    const source = readSource("src/app/(site)/blog/page.tsx");
    strict_1.default.ok(source.includes("const [featuredPost, ...remainingPosts] = posts"));
    strict_1.default.ok(source.includes("className=\"blog-featured\""));
    strict_1.default.ok(source.includes("className=\"blog-category-row\""));
    strict_1.default.ok(source.includes("className=\"blog-post-grid\""));
}
async function testMetadataAndContentHelpers() {
    var _a, _b, _c, _d;
    const metadata = (0, blog_public_content_1.buildPublicBlogPostMetadata)({
        title: "Sample Post",
        excerpt: "Default excerpt",
        metaTitle: "Custom Meta Title",
        metaDescription: "Custom Meta Description",
        ogImageUrl: "/media/og-image.jpg",
        featuredImageUrl: "/media/featured.jpg",
        canonicalUrl: "https://www.blissfulplaceresidences.com/blog/custom-canonical",
        slug: "sample-post",
    });
    strict_1.default.equal(metadata.title, "Custom Meta Title");
    strict_1.default.equal(metadata.description, "Custom Meta Description");
    strict_1.default.equal(getFirstImageUrl((_a = metadata.openGraph) === null || _a === void 0 ? void 0 : _a.images), "/media/og-image.jpg");
    strict_1.default.equal((_b = metadata.alternates) === null || _b === void 0 ? void 0 : _b.canonical, "https://www.blissfulplaceresidences.com/blog/custom-canonical");
    const fallbackMetadata = (0, blog_public_content_1.buildPublicBlogPostMetadata)({
        title: "Fallback Post",
        excerpt: "Fallback excerpt",
        metaTitle: "",
        metaDescription: "",
        ogImageUrl: null,
        featuredImageUrl: "/media/fallback-featured.jpg",
        canonicalUrl: null,
        slug: "fallback-post",
    });
    strict_1.default.equal(fallbackMetadata.title, "Fallback Post");
    strict_1.default.equal(fallbackMetadata.description, "Fallback excerpt");
    strict_1.default.equal(getFirstImageUrl((_c = fallbackMetadata.openGraph) === null || _c === void 0 ? void 0 : _c.images), "/media/fallback-featured.jpg");
    strict_1.default.equal((_d = fallbackMetadata.alternates) === null || _d === void 0 ? void 0 : _d.canonical, "/blog/fallback-post");
    const minimalMetadata = (0, blog_public_content_1.buildPublicBlogPostMetadata)({
        title: "Minimal Post",
        excerpt: "",
        metaTitle: "",
        metaDescription: "",
        ogImageUrl: null,
        featuredImageUrl: null,
        canonicalUrl: null,
        slug: "minimal-post",
    });
    strict_1.default.equal(minimalMetadata.description, "Read this article on Blissful Place Residences.");
    const paragraphs = (0, blog_public_content_1.extractLexicalParagraphs)({
        root: {
            children: [
                { children: [{ text: "First paragraph" }] },
                { children: [{ text: "Second paragraph" }] },
            ],
        },
    });
    strict_1.default.deepEqual(paragraphs, ["First paragraph", "Second paragraph"]);
    strict_1.default.equal((0, blog_public_content_1.resolvePublicBlogIntro)("Explicit intro", paragraphs), "Explicit intro");
    strict_1.default.equal((0, blog_public_content_1.resolvePublicBlogIntro)("", paragraphs), "First paragraph");
}
async function run() {
    await testPublishedOnlyQueryBehavior();
    await testSlugNormalizationAndInvalidHandling();
    await testPublicMapperSupportsNumericCmsIds();
    await testPublicBlogServiceUsesExplicitPublishedServerQuery();
    await testBlogIndexEditorialLayoutStructure();
    await testMetadataAndContentHelpers();
    console.log("blog-public-routes: ok");
}
void run();
