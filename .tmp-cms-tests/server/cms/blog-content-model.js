"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOG_POST_STATUS_VALUES = void 0;
exports.normalizeBlogSlug = normalizeBlogSlug;
exports.resolveBlogSlug = resolveBlogSlug;
exports.coerceBlogPostStatus = coerceBlogPostStatus;
exports.shouldAutoSetPublishedAt = shouldAutoSetPublishedAt;
exports.BLOG_POST_STATUS_VALUES = ["draft", "published"];
function collapseHyphens(value) {
    return value.replace(/-+/g, "-");
}
function trimEdgeHyphens(value) {
    return value.replace(/^-+/, "").replace(/-+$/, "");
}
function normalizeBlogSlug(input) {
    const lower = input.trim().toLowerCase();
    const dashed = lower
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/[_\s]+/g, "-");
    return trimEdgeHyphens(collapseHyphens(dashed));
}
function toNonEmptyString(value) {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function resolveBlogSlug(currentSlug, title) {
    const explicitSlug = toNonEmptyString(currentSlug);
    if (explicitSlug) {
        const normalizedExplicitSlug = normalizeBlogSlug(explicitSlug);
        return normalizedExplicitSlug.length > 0 ? normalizedExplicitSlug : null;
    }
    const titleValue = toNonEmptyString(title);
    if (!titleValue) {
        return null;
    }
    const normalizedTitleSlug = normalizeBlogSlug(titleValue);
    return normalizedTitleSlug.length > 0 ? normalizedTitleSlug : null;
}
function coerceBlogPostStatus(value) {
    return value === "draft" || value === "published" ? value : null;
}
function shouldAutoSetPublishedAt(status, publishedAt) {
    if (status !== "published") {
        return false;
    }
    return typeof publishedAt !== "string" || publishedAt.trim().length === 0;
}
