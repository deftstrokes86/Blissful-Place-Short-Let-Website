import type { CollectionConfig } from "payload";

import { blogCollectionReadAccess, blogManageAccess } from "@/cms/access-controls";

export const BlogTagsCollection: CollectionConfig = {
  slug: "blog-tags",
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
