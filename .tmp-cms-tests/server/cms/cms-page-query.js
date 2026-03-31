"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePublicCmsPageSlugInput = normalizePublicCmsPageSlugInput;
exports.buildPublishedCmsPageDetailQuery = buildPublishedCmsPageDetailQuery;
const page_builder_model_1 = require("./page-builder-model");
function normalizePublicCmsPageSlugInput(slug) {
    return (0, page_builder_model_1.normalizePageSlug)(slug.trim());
}
function buildPublishedCmsPageDetailQuery(slug) {
    const normalizedSlug = normalizePublicCmsPageSlugInput(slug);
    if (!normalizedSlug) {
        return null;
    }
    return {
        collection: "cms-pages",
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
        depth: 3,
    };
}
