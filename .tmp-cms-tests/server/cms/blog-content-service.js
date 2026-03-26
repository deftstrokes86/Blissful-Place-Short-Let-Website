"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublishedBlogPosts = listPublishedBlogPosts;
exports.findPublishedBlogPostBySlug = findPublishedBlogPostBySlug;
const payload_1 = require("@/cms/payload");
const blog_public_query_1 = require("@/server/cms/blog-public-query");
function asRecord(value) {
    if (!value || typeof value !== "object") {
        return null;
    }
    return value;
}
function asString(value) {
    return typeof value === "string" ? value : "";
}
function asNullableString(value) {
    return typeof value === "string" && value.length > 0 ? value : null;
}
function mapCategory(value) {
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = asString(record.id);
    const title = asString(record.title);
    const slug = asString(record.slug);
    if (!id || !title || !slug) {
        return null;
    }
    return { id, title, slug };
}
function mapCategories(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((entry) => mapCategory(entry))
        .filter((entry) => Boolean(entry));
}
function mapMedia(value) {
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = asString(record.id);
    const url = asString(record.url);
    if (!id || !url) {
        return null;
    }
    return {
        id,
        url,
        alt: asString(record.alt),
    };
}
function mapAuthor(value) {
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = asString(record.id);
    const name = asString(record.name);
    if (!id || !name) {
        return null;
    }
    return { id, name };
}
function mapSummary(value) {
    var _a, _b, _c;
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = asString(record.id);
    const title = asString(record.title);
    const slug = asString(record.slug);
    if (!id || !title || !slug) {
        return null;
    }
    const featuredImage = mapMedia(record.featuredImage);
    const author = mapAuthor(record.author);
    return {
        id,
        title,
        slug,
        excerpt: asString(record.excerpt),
        publishedAt: asNullableString(record.publishedAt),
        categories: mapCategories(record.categories),
        authorName: (_a = author === null || author === void 0 ? void 0 : author.name) !== null && _a !== void 0 ? _a : null,
        featuredImageUrl: (_b = featuredImage === null || featuredImage === void 0 ? void 0 : featuredImage.url) !== null && _b !== void 0 ? _b : null,
        featuredImageAlt: (_c = featuredImage === null || featuredImage === void 0 ? void 0 : featuredImage.alt) !== null && _c !== void 0 ? _c : "",
    };
}
function mapDetail(value) {
    var _a, _b;
    const summary = mapSummary(value);
    const record = asRecord(value);
    if (!summary || !record) {
        return null;
    }
    const ogImage = mapMedia(record.ogImage);
    return Object.assign(Object.assign({}, summary), { content: (_a = record.content) !== null && _a !== void 0 ? _a : null, metaTitle: asString(record.metaTitle), metaDescription: asString(record.metaDescription), ogImageUrl: (_b = ogImage === null || ogImage === void 0 ? void 0 : ogImage.url) !== null && _b !== void 0 ? _b : null, canonicalUrl: asNullableString(record.canonicalUrl) });
}
async function listPublishedBlogPosts(limit = 20) {
    const payload = await (0, payload_1.getCmsPayload)();
    const result = await payload.find(Object.assign(Object.assign({}, (0, blog_public_query_1.buildPublishedBlogListQuery)(limit)), { overrideAccess: true }));
    return result.docs
        .map((doc) => mapSummary(doc))
        .filter((entry) => Boolean(entry));
}
async function findPublishedBlogPostBySlug(slug) {
    const detailQuery = (0, blog_public_query_1.buildPublishedBlogDetailQuery)(slug);
    if (!detailQuery) {
        return null;
    }
    const payload = await (0, payload_1.getCmsPayload)();
    const result = await payload.find(Object.assign(Object.assign({}, detailQuery), { overrideAccess: true }));
    if (result.docs.length === 0) {
        return null;
    }
    return mapDetail(result.docs[0]);
}
