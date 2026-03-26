"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPostsCollection = void 0;
const access_controls_1 = require("../access-controls");
const blog_content_model_1 = require("../../server/cms/blog-content-model");
const cms_access_1 = require("../../server/cms/cms-access");
function toRecord(value) {
    if (!value || typeof value !== "object") {
        return null;
    }
    return value;
}
const applyDerivedBlogPostValues = ({ data }) => {
    const record = toRecord(data);
    if (!record) {
        return data;
    }
    const resolvedSlug = (0, blog_content_model_1.resolveBlogSlug)(record.slug, record.title);
    const resolvedContent = (0, blog_content_model_1.resolveBlogContent)(record.content, record.excerpt, record.title);
    const nextRecord = Object.assign({}, record);
    if (resolvedSlug) {
        nextRecord.slug = resolvedSlug;
    }
    if (resolvedContent) {
        nextRecord.content = resolvedContent;
    }
    return nextRecord;
};
const enforceBlogStatusAndPublishedDate = ({ data, req }) => {
    const record = toRecord(data);
    if (!record) {
        return data;
    }
    const role = (0, cms_access_1.getCmsRoleFromRequestUser)(req.user);
    const nextStatus = (0, blog_content_model_1.coerceBlogPostStatus)(record.status);
    if (nextStatus && !(0, cms_access_1.canSetBlogStatus)(role, nextStatus)) {
        throw new Error("Your role cannot set this blog post status.");
    }
    if (nextStatus && (0, blog_content_model_1.shouldAutoSetPublishedAt)(nextStatus, record.publishedAt)) {
        return Object.assign(Object.assign({}, record), { publishedAt: new Date().toISOString() });
    }
    return data;
};
exports.BlogPostsCollection = {
    slug: "blog-posts",
    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "status", "publishedAt", "updatedAt"],
    },
    access: {
        read: access_controls_1.blogReadAccess,
        create: access_controls_1.blogCreateAccess,
        update: access_controls_1.blogDraftWriteAccess,
        delete: access_controls_1.blogDraftWriteAccess,
    },
    versions: {
        drafts: true,
    },
    hooks: {
        beforeValidate: [applyDerivedBlogPostValues],
        beforeChange: [enforceBlogStatusAndPublishedDate],
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
            name: "excerpt",
            type: "textarea",
            required: true,
        },
        {
            name: "content",
            type: "richText",
            required: true,
        },
        {
            name: "featuredImage",
            type: "upload",
            relationTo: "blog-media",
        },
        {
            name: "author",
            type: "relationship",
            relationTo: "cms-users",
            required: true,
            admin: {
                position: "sidebar",
            },
        },
        {
            name: "categories",
            type: "relationship",
            relationTo: "blog-categories",
            hasMany: true,
            required: true,
        },
        {
            name: "tags",
            type: "relationship",
            relationTo: "blog-tags",
            hasMany: true,
        },
        {
            name: "status",
            type: "select",
            required: true,
            defaultValue: "draft",
            options: [
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
            ],
        },
        {
            name: "publishedAt",
            type: "date",
            admin: {
                date: {
                    pickerAppearance: "dayAndTime",
                },
            },
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
