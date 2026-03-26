"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePublicBlogSlugInput = normalizePublicBlogSlugInput;
exports.buildPublishedBlogListQuery = buildPublishedBlogListQuery;
exports.buildPublishedBlogDetailQuery = buildPublishedBlogDetailQuery;
function normalizePublicBlogSlugInput(slug) {
    return slug.trim().toLowerCase();
}
function buildPublishedBlogListQuery(limit) {
    return {
        collection: "blog-posts",
        where: {
            status: {
                equals: "published",
            },
        },
        sort: "-publishedAt",
        limit,
        depth: 1,
    };
}
function buildPublishedBlogDetailQuery(slug) {
    const normalizedSlug = normalizePublicBlogSlugInput(slug);
    if (!normalizedSlug) {
        return null;
    }
    return {
        collection: "blog-posts",
        where: {
            and: [
                {
                    slug: {
                        equals: normalizedSlug,
                    },
                },
                {
                    status: {
                        equals: "published",
                    },
                },
            ],
        },
        limit: 1,
        depth: 2,
    };
}
