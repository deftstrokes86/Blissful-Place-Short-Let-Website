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
    // Local filesystem remains the dev fallback.
    // Production Supabase-backed object storage is configured centrally in payload.config.ts.
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

