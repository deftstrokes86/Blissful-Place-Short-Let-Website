"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsInventoryTemplateItemsCollection = void 0;
const access_controls_1 = require("@/cms/access-controls");
exports.CmsInventoryTemplateItemsCollection = {
    slug: "cms-inventory-template-items",
    admin: {
        useAsTitle: "inventoryItemId",
        defaultColumns: ["templateId", "inventoryItemId", "expectedQuantity", "updatedAt"],
    },
    access: {
        read: access_controls_1.inventoryReadAccess,
        create: access_controls_1.inventoryManageAccess,
        update: access_controls_1.inventoryManageAccess,
        delete: access_controls_1.inventoryManageAccess,
    },
    fields: [
        {
            name: "templateId",
            type: "relationship",
            relationTo: "cms-inventory-templates",
            required: true,
        },
        {
            name: "inventoryItemId",
            type: "relationship",
            relationTo: "cms-inventory-items",
            required: true,
        },
        {
            name: "expectedQuantity",
            type: "number",
            required: true,
            min: 1,
            defaultValue: 1,
        },
        {
            name: "isRequired",
            type: "checkbox",
            defaultValue: true,
        },
        {
            name: "notes",
            type: "textarea",
        },
    ],
};
