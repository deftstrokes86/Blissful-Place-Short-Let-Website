"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogMediaCollection = void 0;
const access_controls_1 = require("../access-controls");
exports.BlogMediaCollection = {
    slug: "blog-media",
    admin: {
        useAsTitle: "alt",
    },
    access: {
        read: access_controls_1.blogMediaPublicReadAccess,
        create: access_controls_1.blogManageAccess,
        update: access_controls_1.blogManageAccess,
        delete: access_controls_1.blogManageAccess,
    },
    upload: {
        // Local filesystem remains the dev fallback.
        // Production object storage is configured centrally in payload.config.ts.
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
