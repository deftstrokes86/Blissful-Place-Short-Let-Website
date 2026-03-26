"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMS_ROLE_VALUES = void 0;
exports.isCmsRole = isCmsRole;
exports.getCmsRoleFromRequestUser = getCmsRoleFromRequestUser;
exports.getCmsUserIdFromRequestUser = getCmsUserIdFromRequestUser;
exports.canManageBlog = canManageBlog;
exports.canReadBlogCollections = canReadBlogCollections;
exports.canCreateBlogDraft = canCreateBlogDraft;
exports.canSetBlogStatus = canSetBlogStatus;
exports.canManageInventory = canManageInventory;
exports.canReadInventory = canReadInventory;
exports.canManageCmsUsers = canManageCmsUsers;
exports.buildBlogReadAccessConstraint = buildBlogReadAccessConstraint;
exports.buildBlogDraftWriteConstraint = buildBlogDraftWriteConstraint;
exports.CMS_ROLE_VALUES = ["admin", "inventory_manager", "blog_manager", "author"];
function isRecord(value) {
    return Boolean(value) && typeof value === "object";
}
function isCmsRole(value) {
    return typeof value === "string" && exports.CMS_ROLE_VALUES.includes(value);
}
function getCmsRoleFromRequestUser(user) {
    if (!isRecord(user)) {
        return null;
    }
    const role = user.role;
    return isCmsRole(role) ? role : null;
}
function getCmsUserIdFromRequestUser(user) {
    if (!isRecord(user)) {
        return null;
    }
    const userId = user.id;
    return typeof userId === "string" && userId.length > 0 ? userId : null;
}
function canManageBlog(role) {
    return role === "admin" || role === "blog_manager";
}
function canReadBlogCollections(role) {
    return canManageBlog(role) || role === "author";
}
function canCreateBlogDraft(role) {
    return canManageBlog(role) || role === "author";
}
function canSetBlogStatus(role, status) {
    if (status === "draft") {
        return canCreateBlogDraft(role);
    }
    return canManageBlog(role);
}
function canManageInventory(role) {
    return role === "admin" || role === "inventory_manager";
}
function canReadInventory(role) {
    return canManageInventory(role);
}
function canManageCmsUsers(role) {
    return role === "admin";
}
function buildOwnDraftConstraint(userId) {
    return {
        and: [
            { author: { equals: userId } },
            { status: { equals: "draft" } },
        ],
    };
}
function buildBlogReadAccessConstraint(role, userId) {
    if (canManageBlog(role)) {
        return true;
    }
    if (role === "author" && userId) {
        const publishedConstraint = {
            status: {
                equals: "published",
            },
        };
        return {
            or: [publishedConstraint, buildOwnDraftConstraint(userId)],
        };
    }
    // Keep CMS blog collections internal to authenticated blog roles.
    // Public pages fetch published content via explicit server-side queries.
    return false;
}
function buildBlogDraftWriteConstraint(role, userId) {
    if (canManageBlog(role)) {
        return true;
    }
    if (role === "author" && userId) {
        return buildOwnDraftConstraint(userId);
    }
    return false;
}
