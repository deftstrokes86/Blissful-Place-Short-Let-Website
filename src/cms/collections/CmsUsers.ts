import type { CollectionConfig } from "payload";

import { cmsAdminOnlyAccess } from "../access-controls";

export const CmsUsersCollection: CollectionConfig = {
  slug: "cms-users",
  auth: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "role", "updatedAt"],
  },
  access: {
    read: cmsAdminOnlyAccess,
    create: cmsAdminOnlyAccess,
    update: cmsAdminOnlyAccess,
    delete: cmsAdminOnlyAccess,
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
