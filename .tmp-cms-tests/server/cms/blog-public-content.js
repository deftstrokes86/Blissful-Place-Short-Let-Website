"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePublicLexicalContentState = resolvePublicLexicalContentState;
exports.extractLexicalParagraphs = extractLexicalParagraphs;
exports.resolvePublicBlogIntro = resolvePublicBlogIntro;
exports.buildPublicBlogPostMetadata = buildPublicBlogPostMetadata;
function asNonEmptyString(value) {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function collectTextContent(value) {
    if (!value || typeof value !== "object") {
        return [];
    }
    const record = value;
    const text = typeof record.text === "string" ? record.text.trim() : "";
    const children = Array.isArray(record.children) ? record.children : [];
    const nestedText = children.flatMap((child) => collectTextContent(child));
    if (text.length > 0) {
        return [text, ...nestedText];
    }
    return nestedText;
}
function resolvePublicLexicalContentState(content) {
    if (!isRecord(content)) {
        return null;
    }
    const root = content.root;
    if (!isRecord(root)) {
        return null;
    }
    const children = root.children;
    if (!Array.isArray(children)) {
        return null;
    }
    if (typeof root.type === "string" && root.type !== "root") {
        return null;
    }
    return content;
}
function extractLexicalParagraphs(content) {
    const lexicalContent = resolvePublicLexicalContentState(content);
    if (!lexicalContent) {
        return [];
    }
    const rootRecord = lexicalContent.root;
    const nestedChildren = Array.isArray(rootRecord.children) ? rootRecord.children : [];
    const rawParagraphs = nestedChildren
        .flatMap((entry) => collectTextContent(entry))
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    return Array.from(new Set(rawParagraphs));
}
function resolvePublicBlogIntro(excerpt, paragraphs) {
    var _a, _b;
    return (_b = (_a = asNonEmptyString(excerpt)) !== null && _a !== void 0 ? _a : paragraphs[0]) !== null && _b !== void 0 ? _b : "";
}
function buildPublicBlogPostMetadata(input) {
    var _a, _b, _c, _d, _e;
    const title = (_a = asNonEmptyString(input.metaTitle)) !== null && _a !== void 0 ? _a : input.title;
    const description = (_c = (_b = asNonEmptyString(input.metaDescription)) !== null && _b !== void 0 ? _b : asNonEmptyString(input.excerpt)) !== null && _c !== void 0 ? _c : "Read this article on Blissful Place Residences.";
    const socialImage = (_d = asNonEmptyString(input.ogImageUrl)) !== null && _d !== void 0 ? _d : asNonEmptyString(input.featuredImageUrl);
    const canonical = (_e = asNonEmptyString(input.canonicalUrl)) !== null && _e !== void 0 ? _e : `/blog/${input.slug}`;
    return {
        title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            type: "article",
            title,
            description,
            images: socialImage ? [{ url: socialImage, alt: title }] : undefined,
        },
        twitter: {
            card: socialImage ? "summary_large_image" : "summary",
            title,
            description,
            images: socialImage ? [socialImage] : undefined,
        },
    };
}
