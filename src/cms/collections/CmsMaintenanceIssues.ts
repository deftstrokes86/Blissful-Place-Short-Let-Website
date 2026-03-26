import type { CollectionConfig } from "payload";

import { inventoryReadAccess } from "../access-controls";

export const CmsMaintenanceIssuesCollection: CollectionConfig = {
  slug: "cms-maintenance-issues",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["flatId", "severity", "status", "updatedAt"],
  },
  access: {
    read: inventoryReadAccess,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "flatId",
      type: "select",
      required: true,
      options: [
        { label: "Windsor", value: "windsor" },
        { label: "Kensington", value: "kensington" },
        { label: "Mayfair", value: "mayfair" },
      ],
    },
    {
      name: "inventoryItemId",
      type: "relationship",
      relationTo: "cms-inventory-items",
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "notes",
      type: "textarea",
    },
    {
      name: "severity",
      type: "select",
      required: true,
      options: [
        { label: "Critical", value: "critical" },
        { label: "Important", value: "important" },
        { label: "Minor", value: "minor" },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "open",
      options: [
        { label: "Open", value: "open" },
        { label: "In Progress", value: "in_progress" },
        { label: "Resolved", value: "resolved" },
        { label: "Closed", value: "closed" },
      ],
    },
    {
      name: "resolvedAt",
      type: "date",
    },
  ],
};

