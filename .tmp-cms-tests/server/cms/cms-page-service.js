"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPublishedCmsPageBySlug = findPublishedCmsPageBySlug;
const payload_1 = require("@/cms/payload");
const cms_page_mappers_1 = require("@/server/cms/cms-page-mappers");
const cms_page_query_1 = require("@/server/cms/cms-page-query");
async function findPublishedCmsPageBySlug(slug) {
    const detailQuery = (0, cms_page_query_1.buildPublishedCmsPageDetailQuery)(slug);
    if (!detailQuery) {
        return null;
    }
    const payload = await (0, payload_1.getCmsPayload)();
    try {
        const result = await payload.find(Object.assign(Object.assign({}, detailQuery), { overrideAccess: true }));
        if (result.docs.length === 0) {
            return null;
        }
        return (0, cms_page_mappers_1.mapPublicCmsPageDetail)(result.docs[0]);
    }
    catch (_a) {
        return null;
    }
}
