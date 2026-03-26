"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublishedBlogPosts = listPublishedBlogPosts;
exports.findPublishedBlogPostBySlug = findPublishedBlogPostBySlug;
const payload_1 = require("@/cms/payload");
const blog_public_mappers_1 = require("@/server/cms/blog-public-mappers");
const blog_public_query_1 = require("@/server/cms/blog-public-query");
async function listPublishedBlogPosts(limit = 20) {
    const payload = await (0, payload_1.getCmsPayload)();
    try {
        const result = await payload.find(Object.assign(Object.assign({}, (0, blog_public_query_1.buildPublishedBlogListQuery)(limit)), { overrideAccess: true }));
        return result.docs
            .map((doc) => (0, blog_public_mappers_1.mapPublicBlogPostSummary)(doc))
            .filter((entry) => Boolean(entry));
    }
    catch (_a) {
        return [];
    }
}
async function findPublishedBlogPostBySlug(slug) {
    const detailQuery = (0, blog_public_query_1.buildPublishedBlogDetailQuery)(slug);
    if (!detailQuery) {
        return null;
    }
    const payload = await (0, payload_1.getCmsPayload)();
    try {
        const result = await payload.find(Object.assign(Object.assign({}, detailQuery), { overrideAccess: true }));
        if (result.docs.length === 0) {
            return null;
        }
        return (0, blog_public_mappers_1.mapPublicBlogPostDetail)(result.docs[0]);
    }
    catch (_a) {
        return null;
    }
}
