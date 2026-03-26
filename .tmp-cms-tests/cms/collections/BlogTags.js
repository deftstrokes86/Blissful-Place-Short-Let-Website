"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogTagsCollection = void 0;
const access_controls_1 = require("../access-controls");
exports.BlogTagsCollection = {
    slug: "blog-tags",
    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "slug", "updatedAt"],
    },
    access: {
        read: access_controls_1.blogCollectionReadAccess,
        create: access_controls_1.blogManageAccess,
        update: access_controls_1.blogManageAccess,
        delete: access_controls_1.blogManageAccess,
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
        },
        {
            name: "description",
            type: "textarea",
        },
    ],
};
