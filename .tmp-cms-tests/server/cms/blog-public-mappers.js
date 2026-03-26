"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapBlogCategorySummary = mapBlogCategorySummary;
exports.mapBlogMediaSummary = mapBlogMediaSummary;
exports.mapBlogAuthorSummary = mapBlogAuthorSummary;
exports.mapPublicBlogPostSummary = mapPublicBlogPostSummary;
exports.mapPublicBlogPostDetail = mapPublicBlogPostDetail;
function asRecord(value) {
    if (!value || typeof value !== "object") {
        return null;
    }
    return value;
}
function asString(value) {
    return typeof value === "string" ? value : "";
}
function asIdentifier(value) {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return value.toString();
    }
    return "";
}
function asNullableString(value) {
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return null;
}
function mapBlogCategorySummary(value) {
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = asIdentifier(record.id);
    const title = asString(record.title);
    const slug = asString(record.slug);
    if (!id || !title || !slug) {
        return null;
    }
    return { id, title, slug };
}
function mapBlogCategories(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((entry) => mapBlogCategorySummary(entry))
        .filter((entry) => Boolean(entry));
}
function mapBlogMediaSummary(value) {
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = asIdentifier(record.id);
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
function mapBlogAuthorSummary(value) {
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = asIdentifier(record.id);
    const name = asString(record.name);
    if (!id || !name) {
        return null;
    }
    return { id, name };
}
function mapPublicBlogPostSummary(value) {
    var _a, _b, _c;
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = asIdentifier(record.id);
    const title = asString(record.title);
    const slug = asString(record.slug);
    if (!id || !title || !slug) {
        return null;
    }
    const featuredImage = mapBlogMediaSummary(record.featuredImage);
    const author = mapBlogAuthorSummary(record.author);
    return {
        id,
        title,
        slug,
        excerpt: asString(record.excerpt),
        publishedAt: asNullableString(record.publishedAt),
        categories: mapBlogCategories(record.categories),
        authorName: (_a = author === null || author === void 0 ? void 0 : author.name) !== null && _a !== void 0 ? _a : null,
        featuredImageUrl: (_b = featuredImage === null || featuredImage === void 0 ? void 0 : featuredImage.url) !== null && _b !== void 0 ? _b : null,
        featuredImageAlt: (_c = featuredImage === null || featuredImage === void 0 ? void 0 : featuredImage.alt) !== null && _c !== void 0 ? _c : "",
    };
}
function mapPublicBlogPostDetail(value) {
    var _a, _b;
    const summary = mapPublicBlogPostSummary(value);
    const record = asRecord(value);
    if (!summary || !record) {
        return null;
    }
    const ogImage = mapBlogMediaSummary(record.ogImage);
    return Object.assign(Object.assign({}, summary), { content: (_a = record.content) !== null && _a !== void 0 ? _a : null, metaTitle: asString(record.metaTitle), metaDescription: asString(record.metaDescription), ogImageUrl: (_b = ogImage === null || ogImage === void 0 ? void 0 : ogImage.url) !== null && _b !== void 0 ? _b : null, canonicalUrl: asNullableString(record.canonicalUrl) });
}
