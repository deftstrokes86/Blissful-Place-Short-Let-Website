"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsInventoryItemsCollection = void 0;
const access_controls_1 = require("@/cms/access-controls");
exports.CmsInventoryItemsCollection = {
    slug: "cms-inventory-items",
    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "sku", "category", "isCritical", "updatedAt"],
    },
    access: {
        read: access_controls_1.inventoryReadAccess,
        create: access_controls_1.inventoryManageAccess,
        update: access_controls_1.inventoryManageAccess,
        delete: access_controls_1.inventoryManageAccess,
    },
    fields: [
        {
            name: "sku",
            type: "text",
            required: true,
            unique: true,
        },
        {
            name: "name",
            type: "text",
            required: true,
        },
        {
            name: "category",
            type: "select",
            required: true,
            options: [
                { label: "Asset", value: "asset" },
                { label: "Consumable", value: "consumable" },
                { label: "Maintenance Supply", value: "maintenance_supply" },
            ],
        },
        {
            name: "unit",
            type: "text",
            required: true,
            defaultValue: "piece",
        },
        {
            name: "isCritical",
            type: "checkbox",
            defaultValue: false,
        },
        {
            name: "referenceImage",
            type: "upload",
            relationTo: "blog-media",
        },
        {
            name: "reorderThreshold",
            type: "number",
            min: 0,
        },
        {
            name: "isActive",
            type: "checkbox",
            defaultValue: true,
        },
    ],
};
