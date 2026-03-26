import type { CollectionConfig } from "payload";

import { blogCollectionReadAccess, blogManageAccess } from "../access-controls";

export const BlogCategoriesCollection: CollectionConfig = {
  slug: "blog-categories",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
  },
  access: {
    read: blogCollectionReadAccess,
    create: blogManageAccess,
    update: blogManageAccess,
    delete: blogManageAccess,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "description",
      type: "textarea",
    },
  ],
};
