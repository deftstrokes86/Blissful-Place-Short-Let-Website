"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsInventoryTemplatesCollection = void 0;
const access_controls_1 = require("../access-controls");
exports.CmsInventoryTemplatesCollection = {
    slug: "cms-inventory-templates",
    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "flatType", "isActive", "updatedAt"],
    },
    access: {
        read: access_controls_1.inventoryReadAccess,
        create: access_controls_1.inventoryManageAccess,
        update: access_controls_1.inventoryManageAccess,
        delete: access_controls_1.inventoryManageAccess,
    },
    fields: [
        {
            name: "name",
            type: "text",
            required: true,
        },
        {
            name: "description",
            type: "textarea",
        },
        {
            name: "flatType",
            type: "text",
        },
        {
            name: "isActive",
            type: "checkbox",
            defaultValue: true,
        },
    ],
};
