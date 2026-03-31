"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsPagesCollection = void 0;
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const access_controls_1 = require("../access-controls");
const page_builder_model_1 = require("../../server/cms/page-builder-model");
function toRecord(value) {
    if (!value || typeof value !== "object") {
        return null;
    }
    return value;
}
const richTextFieldEditor = (0, richtext_lexical_1.lexicalEditor)({
    features: ({ defaultFeatures }) => [...defaultFeatures, (0, richtext_lexical_1.FixedToolbarFeature)()],
});
const applyDerivedPageValues = ({ data }) => {
    const record = toRecord(data);
    if (!record) {
        return data;
    }
    const resolvedSlug = (0, page_builder_model_1.resolvePageSlug)(record.slug, record.title);
    if (!resolvedSlug) {
        return data;
    }
    return Object.assign(Object.assign({}, record), { slug: resolvedSlug });
};
const enforcePagePublishedDate = ({ data }) => {
    const record = toRecord(data);
    if (!record) {
        return data;
    }
    const nextStatus = (0, page_builder_model_1.coercePageStatus)(record.status);
    if (nextStatus && (0, page_builder_model_1.shouldAutoSetPagePublishedAt)(nextStatus, record.publishedAt)) {
        return Object.assign(Object.assign({}, record), { publishedAt: new Date().toISOString() });
    }
    return data;
};
exports.CmsPagesCollection = {
    slug: "cms-pages",
    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "slug", "status", "updatedAt"],
        group: "Content",
    },
    access: {
        read: access_controls_1.blogCollectionReadAccess,
        create: access_controls_1.blogManageAccess,
        update: access_controls_1.blogManageAccess,
        delete: access_controls_1.blogManageAccess,
    },
    versions: {
        drafts: true,
    },
    hooks: {
        beforeValidate: [applyDerivedPageValues],
        beforeChange: [enforcePagePublishedDate],
    },
    fields: [
        {
            name: "title",
            type: "text",
            required: true,
        },
        {
            name: "slug",
            type: "text",
            required: true,
            unique: true,
            index: true,
        },
        {
            name: "status",
            type: "select",
            required: true,
            defaultValue: "draft",
            admin: {
                position: "sidebar",
            },
            options: [
                {
                    label: "Draft",
                    value: "draft",
                },
                {
                    label: "Published",
                    value: "published",
                },
            ],
        },
        {
            name: "publishedAt",
            type: "date",
            admin: {
                position: "sidebar",
                date: {
                    pickerAppearance: "dayAndTime",
                },
            },
        },
        {
            name: "layout",
            type: "blocks",
            required: true,
            blocks: [
                {
                    slug: "hero",
                    labels: {
                        singular: "Hero",
                        plural: "Hero Blocks",
                    },
                    fields: [
                        {
                            name: "eyebrow",
                            type: "text",
                        },
                        {
                            name: "heading",
                            type: "text",
                            required: true,
                        },
                        {
                            name: "subheading",
                            type: "textarea",
                        },
                        {
                            name: "backgroundImage",
                            type: "upload",
                            relationTo: "blog-media",
                        },
                        {
                            name: "primaryActionLabel",
                            type: "text",
                        },
                        {
                            name: "primaryActionHref",
                            type: "text",
                        },
                        {
                            name: "secondaryActionLabel",
                            type: "text",
                        },
                        {
                            name: "secondaryActionHref",
                            type: "text",
                        },
                    ],
                },
                {
                    slug: "richText",
                    labels: {
                        singular: "Rich Text",
                        plural: "Rich Text Blocks",
                    },
                    fields: [
                        {
                            name: "heading",
                            type: "text",
                        },
                        {
                            name: "body",
                            type: "richText",
                            required: true,
                            editor: richTextFieldEditor,
                        },
                    ],
                },
                {
                    slug: "featureGrid",
                    labels: {
                        singular: "Feature Grid",
                        plural: "Feature Grids",
                    },
                    fields: [
                        {
                            name: "heading",
                            type: "text",
                        },
                        {
                            name: "intro",
                            type: "textarea",
                        },
                        {
                            name: "items",
                            type: "array",
                            required: true,
                            minRows: 1,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    required: true,
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    required: true,
                                },
                                {
                                    name: "iconName",
                                    type: "text",
                                },
                            ],
                        },
                    ],
                },
                {
                    slug: "mediaSplit",
                    labels: {
                        singular: "Media Split",
                        plural: "Media Split Blocks",
                    },
                    fields: [
                        {
                            name: "heading",
                            type: "text",
                            required: true,
                        },
                        {
                            name: "body",
                            type: "richText",
                            required: true,
                            editor: richTextFieldEditor,
                        },
                        {
                            name: "image",
                            type: "upload",
                            relationTo: "blog-media",
                            required: true,
                        },
                        {
                            name: "imagePosition",
                            type: "select",
                            defaultValue: "right",
                            options: [
                                {
                                    label: "Left",
                                    value: "left",
                                },
                                {
                                    label: "Right",
                                    value: "right",
                                },
                            ],
                        },
                    ],
                },
                {
                    slug: "ctaStrip",
                    labels: {
                        singular: "CTA Strip",
                        plural: "CTA Strips",
                    },
                    fields: [
                        {
                            name: "eyebrow",
                            type: "text",
                        },
                        {
                            name: "heading",
                            type: "text",
                            required: true,
                        },
                        {
                            name: "body",
                            type: "textarea",
                        },
                        {
                            name: "primaryActionLabel",
                            type: "text",
                            required: true,
                        },
                        {
                            name: "primaryActionHref",
                            type: "text",
                            required: true,
                        },
                        {
                            name: "secondaryActionLabel",
                            type: "text",
                        },
                        {
                            name: "secondaryActionHref",
                            type: "text",
                        },
                    ],
                },
            ],
        },
        {
            type: "collapsible",
            label: "SEO",
            fields: [
                {
                    name: "metaTitle",
                    type: "text",
                },
                {
                    name: "metaDescription",
                    type: "textarea",
                },
                {
                    name: "ogImage",
                    type: "upload",
                    relationTo: "blog-media",
                },
                {
                    name: "canonicalUrl",
                    type: "text",
                },
            ],
        },
    ],
};
