"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsUsersCollection = void 0;
const access_controls_1 = require("@/cms/access-controls");
exports.CmsUsersCollection = {
    slug: "cms-users",
    auth: true,
    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "email", "role", "updatedAt"],
    },
    access: {
        read: access_controls_1.cmsAdminOnlyAccess,
        create: access_controls_1.cmsAdminOnlyAccess,
        update: access_controls_1.cmsAdminOnlyAccess,
        delete: access_controls_1.cmsAdminOnlyAccess,
    },
    fields: [
        {
            name: "name",
            type: "text",
            required: true,
        },
        {
            name: "role",
            type: "select",
            required: true,
            defaultValue: "author",
            options: [
                {
                    label: "Admin",
                    value: "admin",
                },
                {
                    label: "Inventory Manager",
                    value: "inventory_manager",
                },
                {
                    label: "Blog Manager",
                    value: "blog_manager",
                },
                {
                    label: "Author",
                    value: "author",
                },
            ],
        },
    ],
};
