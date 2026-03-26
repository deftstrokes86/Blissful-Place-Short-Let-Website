import type { CollectionConfig } from "payload";

import { inventoryManageAccess, inventoryReadAccess } from "../access-controls";

export const CmsInventoryItemsCollection: CollectionConfig = {
  slug: "cms-inventory-items",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "sku", "category", "isCritical", "updatedAt"],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryManageAccess,
    update: inventoryManageAccess,
    delete: inventoryManageAccess,
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
