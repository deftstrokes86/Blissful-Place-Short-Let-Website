"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublishedBlogPosts = listPublishedBlogPosts;
exports.findPublishedBlogPostBySlug = findPublishedBlogPostBySlug;
const payload_1 = require("@/cms/payload");
const blog_public_mappers_1 = require("@/server/cms/blog-public-mappers");
const blog_public_query_1 = require("@/server/cms/blog-public-query");
function reportBlogContentError(operation, error, context) {
    console.error("[cms/blog-content-service] Payload blog query failed.", Object.assign(Object.assign({ operation }, context), { error }));
}
async function listPublishedBlogPosts(limit = 20) {
    try {
        const payload = await (0, payload_1.getCmsPayload)();
        const result = await payload.find(Object.assign(Object.assign({}, (0, blog_public_query_1.buildPublishedBlogListQuery)(limit)), { overrideAccess: true }));
        return result.docs
            .map((doc) => (0, blog_public_mappers_1.mapPublicBlogPostSummary)(doc))
            .filter((entry) => Boolean(entry));
    }
    catch (error) {
        reportBlogContentError("listPublishedBlogPosts", error, { limit });
        return [];
    }
}
async function findPublishedBlogPostBySlug(slug) {
    const detailQuery = (0, blog_public_query_1.buildPublishedBlogDetailQuery)(slug);
    if (!detailQuery) {
        return null;
    }
    try {
        const payload = await (0, payload_1.getCmsPayload)();
        const result = await payload.find(Object.assign(Object.assign({}, detailQuery), { overrideAccess: true }));
        if (result.docs.length === 0) {
            return null;
        }
        return (0, blog_public_mappers_1.mapPublicBlogPostDetail)(result.docs[0]);
    }
    catch (error) {
        reportBlogContentError("findPublishedBlogPostBySlug", error, { slug });
        return null;
    }
}
