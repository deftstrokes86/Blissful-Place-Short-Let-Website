"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogMediaCollection = void 0;
const access_controls_1 = require("@/cms/access-controls");
exports.BlogMediaCollection = {
    slug: "blog-media",
    admin: {
        useAsTitle: "alt",
    },
    access: {
        read: access_controls_1.blogCollectionReadAccess,
        create: access_controls_1.blogManageAccess,
        update: access_controls_1.blogManageAccess,
        delete: access_controls_1.blogManageAccess,
    },
    upload: {
        staticDir: "media",
        mimeTypes: ["image/*"],
    },
    fields: [
        {
            name: "alt",
            type: "text",
            required: true,
        },
        {
            name: "caption",
            type: "textarea",
        },
    ],
};
