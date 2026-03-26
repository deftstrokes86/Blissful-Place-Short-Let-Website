import type { CollectionConfig } from "payload";

import { inventoryReadAccess } from "@/cms/access-controls";

export const CmsInventoryAlertsCollection: CollectionConfig = {
  slug: "cms-inventory-alerts",
  admin: {
    useAsTitle: "message",
    defaultColumns: ["alertType", "severity", "status", "flatId", "updatedAt"],
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
      name: "alertType",
      type: "select",
      required: true,
      options: [
        { label: "Low Stock", value: "low_stock" },
        { label: "Missing Required Item", value: "missing_required_item" },
        { label: "Damaged Critical Asset", value: "damaged_critical_asset" },
        { label: "Readiness Issue", value: "readiness_issue" },
        { label: "Readiness Impacting Issue", value: "readiness_impacting_issue" },
      ],
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
        { label: "Acknowledged", value: "acknowledged" },
        { label: "Resolved", value: "resolved" },
      ],
    },
    {
      name: "message",
      type: "textarea",
      required: true,
    },
    {
      name: "resolvedAt",
      type: "date",
    },
  ],
};

