"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPublicCmsPageDetail = mapPublicCmsPageDetail;
function asRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
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
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function asNullableDate(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    return asNullableString(value);
}
function isLexicalState(value) {
    const record = asRecord(value);
    if (!record) {
        return false;
    }
    const root = asRecord(record.root);
    if (!root) {
        return false;
    }
    if (typeof root.type === "string" && root.type !== "root") {
        return false;
    }
    return Array.isArray(root.children);
}
function mapMedia(value) {
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = asIdentifier(record.id);
    const url = asNullableString(record.url);
    if (!id || !url) {
        return null;
    }
    return {
        id,
        url,
        alt: asString(record.alt),
    };
}
function mapFeatureItems(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((entry) => asRecord(entry))
        .filter((entry) => Boolean(entry))
        .map((entry) => ({
        title: asString(entry.title),
        description: asString(entry.description),
        iconName: asString(entry.iconName),
    }))
        .filter((entry) => entry.title.length > 0 || entry.description.length > 0);
}
function mapBlock(entry) {
    const record = asRecord(entry);
    if (!record) {
        return null;
    }
    const rawBlockType = asString(record.blockType);
    const id = asIdentifier(record.id) || asIdentifier(record._id) || `${rawBlockType}-block`;
    if (rawBlockType === "hero") {
        return {
            id,
            blockType: "hero",
            eyebrow: asString(record.eyebrow),
            heading: asString(record.heading),
            subheading: asString(record.subheading),
            backgroundImage: mapMedia(record.backgroundImage),
            primaryActionLabel: asString(record.primaryActionLabel),
            primaryActionHref: asString(record.primaryActionHref),
            secondaryActionLabel: asString(record.secondaryActionLabel),
            secondaryActionHref: asString(record.secondaryActionHref),
        };
    }
    if (rawBlockType === "richText") {
        return {
            id,
            blockType: "richText",
            heading: asString(record.heading),
            body: isLexicalState(record.body) ? record.body : null,
        };
    }
    if (rawBlockType === "featureGrid") {
        return {
            id,
            blockType: "featureGrid",
            heading: asString(record.heading),
            intro: asString(record.intro),
            items: mapFeatureItems(record.items),
        };
    }
    if (rawBlockType === "mediaSplit") {
        const imagePosition = asString(record.imagePosition) === "left" ? "left" : "right";
        return {
            id,
            blockType: "mediaSplit",
            heading: asString(record.heading),
            body: isLexicalState(record.body) ? record.body : null,
            image: mapMedia(record.image),
            imagePosition,
        };
    }
    if (rawBlockType === "ctaStrip") {
        return {
            id,
            blockType: "ctaStrip",
            eyebrow: asString(record.eyebrow),
            heading: asString(record.heading),
            body: asString(record.body),
            primaryActionLabel: asString(record.primaryActionLabel),
            primaryActionHref: asString(record.primaryActionHref),
            secondaryActionLabel: asString(record.secondaryActionLabel),
            secondaryActionHref: asString(record.secondaryActionHref),
        };
    }
    return {
        id,
        blockType: "unknown",
    };
}
function mapLayout(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((entry) => mapBlock(entry))
        .filter((entry) => Boolean(entry));
}
function mapPublicCmsPageDetail(value) {
    var _a, _b;
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
    const ogImage = mapMedia(record.ogImage);
    return {
        id,
        title,
        slug,
        status: asString(record.status),
        publishedAt: asNullableDate(record.publishedAt),
        metaTitle: asString(record.metaTitle),
        metaDescription: asString(record.metaDescription),
        canonicalUrl: asNullableString(record.canonicalUrl),
        ogImageUrl: (_a = ogImage === null || ogImage === void 0 ? void 0 : ogImage.url) !== null && _a !== void 0 ? _a : null,
        ogImageAlt: (_b = ogImage === null || ogImage === void 0 ? void 0 : ogImage.alt) !== null && _b !== void 0 ? _b : "",
        layout: mapLayout(record.layout),
    };
}
