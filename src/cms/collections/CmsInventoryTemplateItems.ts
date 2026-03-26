import type { CollectionConfig } from "payload";

import { inventoryManageAccess, inventoryReadAccess } from "../access-controls";

export const CmsInventoryTemplateItemsCollection: CollectionConfig = {
  slug: "cms-inventory-template-items",
  admin: {
    useAsTitle: "inventoryItemId",
    defaultColumns: ["templateId", "inventoryItemId", "expectedQuantity", "updatedAt"],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryManageAccess,
    update: inventoryManageAccess,
    delete: inventoryManageAccess,
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
