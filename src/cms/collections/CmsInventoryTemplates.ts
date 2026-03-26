import type { CollectionConfig } from "payload";

import { inventoryManageAccess, inventoryReadAccess } from "../access-controls";

export const CmsInventoryTemplatesCollection: CollectionConfig = {
  slug: "cms-inventory-templates",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "flatType", "isActive", "updatedAt"],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryManageAccess,
    update: inventoryManageAccess,
    delete: inventoryManageAccess,
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
