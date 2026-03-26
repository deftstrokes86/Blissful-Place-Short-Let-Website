import type { CollectionConfig } from "payload";

import { blogManageAccess, blogMediaPublicReadAccess } from "../access-controls";

export const BlogMediaCollection: CollectionConfig = {
  slug: "blog-media",
  admin: {
    useAsTitle: "alt",
  },
  access: {
    read: blogMediaPublicReadAccess,
    create: blogManageAccess,
    update: blogManageAccess,
    delete: blogManageAccess,
  },
  upload: {
    staticDir: "media",
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      type: "textarea",
    },
  ],
};
