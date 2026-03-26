"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmsAdminOnlyAccess = exports.inventoryManageAccess = exports.inventoryReadAccess = exports.blogDraftWriteAccess = exports.blogCreateAccess = exports.blogManageAccess = exports.blogMediaPublicReadAccess = exports.blogCollectionReadAccess = exports.blogReadAccess = void 0;
const cms_access_1 = require("../server/cms/cms-access");
function getAccessContext(args) {
    var _a;
    const user = (_a = args === null || args === void 0 ? void 0 : args.req) === null || _a === void 0 ? void 0 : _a.user;
    return {
        role: (0, cms_access_1.getCmsRoleFromRequestUser)(user),
        userId: (0, cms_access_1.getCmsUserIdFromRequestUser)(user),
    };
}
function toRoutePath(value) {
    if (typeof value === "string") {
        return value;
    }
    if (value && typeof value === "object") {
        const record = value;
        const nestedPath = record.path;
        if (typeof nestedPath === "string") {
            return nestedPath;
        }
    }
    return "";
}
function isPublicBlogMediaFileRequest(args) {
    const request = args === null || args === void 0 ? void 0 : args.req;
    if (!request) {
        return false;
    }
    const candidates = [
        toRoutePath(request.url),
        toRoutePath(request.originalUrl),
        toRoutePath(request.path),
        toRoutePath(request.route),
    ];
    return candidates.some((candidate) => candidate.includes("/blog-media/file/"));
}
const blogReadAccess = (args) => {
    const { role, userId } = getAccessContext(args);
    return (0, cms_access_1.buildBlogReadAccessConstraint)(role, userId);
};
exports.blogReadAccess = blogReadAccess;
const blogCollectionReadAccess = (args) => {
    const { role } = getAccessContext(args);
    return (0, cms_access_1.canReadBlogCollections)(role);
};
exports.blogCollectionReadAccess = blogCollectionReadAccess;
const blogMediaPublicReadAccess = (args) => {
    if (isPublicBlogMediaFileRequest(args)) {
        return true;
    }
    const { role } = getAccessContext(args);
    return (0, cms_access_1.canReadBlogCollections)(role);
};
exports.blogMediaPublicReadAccess = blogMediaPublicReadAccess;
const blogManageAccess = (args) => {
    const { role } = getAccessContext(args);
    return (0, cms_access_1.canManageBlog)(role);
};
exports.blogManageAccess = blogManageAccess;
const blogCreateAccess = (args) => {
    const { role } = getAccessContext(args);
    return (0, cms_access_1.canCreateBlogDraft)(role);
};
exports.blogCreateAccess = blogCreateAccess;
const blogDraftWriteAccess = (args) => {
    const { role, userId } = getAccessContext(args);
    return (0, cms_access_1.buildBlogDraftWriteConstraint)(role, userId);
};
exports.blogDraftWriteAccess = blogDraftWriteAccess;
const inventoryReadAccess = (args) => {
    const { role } = getAccessContext(args);
    return (0, cms_access_1.canReadInventory)(role);
};
exports.inventoryReadAccess = inventoryReadAccess;
const inventoryManageAccess = (args) => {
    const { role } = getAccessContext(args);
    return (0, cms_access_1.canManageInventory)(role);
};
exports.inventoryManageAccess = inventoryManageAccess;
const cmsAdminOnlyAccess = (args) => {
    const { role } = getAccessContext(args);
    return (0, cms_access_1.canManageCmsUsers)(role);
};
exports.cmsAdminOnlyAccess = cmsAdminOnlyAccess;
