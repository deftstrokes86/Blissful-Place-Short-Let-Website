import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig } from "payload";

import { blogCreateAccess, blogDraftWriteAccess, blogReadAccess } from "@/cms/access-controls";
import {
  coerceBlogPostStatus,
  resolveBlogSlug,
  shouldAutoSetPublishedAt,
} from "@/server/cms/blog-content-model";
import { canSetBlogStatus, getCmsRoleFromRequestUser } from "@/server/cms/cms-access";

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

const applyDerivedBlogPostValues: CollectionBeforeValidateHook = ({ data }) => {
  const record = toRecord(data);

  if (!record) {
    return data;
  }

  const resolvedSlug = resolveBlogSlug(record.slug, record.title);

  if (!resolvedSlug) {
    return data;
  }

  return {
    ...record,
    slug: resolvedSlug,
  };
};

const enforceBlogStatusAndPublishedDate: CollectionBeforeChangeHook = ({ data, req }) => {
  const record = toRecord(data);

  if (!record) {
    return data;
  }

  const role = getCmsRoleFromRequestUser(req.user);
  const nextStatus = coerceBlogPostStatus(record.status);

  if (nextStatus && !canSetBlogStatus(role, nextStatus)) {
    throw new Error("Your role cannot set this blog post status.");
  }

  if (nextStatus && shouldAutoSetPublishedAt(nextStatus, record.publishedAt)) {
    return {
      ...record,
      publishedAt: new Date().toISOString(),
    };
  }

  return data;
};

export const BlogPostsCollection: CollectionConfig = {
  slug: "blog-posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "publishedAt", "updatedAt"],
  },
  access: {
    read: blogReadAccess,
    create: blogCreateAccess,
    update: blogDraftWriteAccess,
    delete: blogDraftWriteAccess,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [applyDerivedBlogPostValues],
    beforeChange: [enforceBlogStatusAndPublishedDate],
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
      index: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "blog-media",
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "cms-users",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "blog-categories",
      hasMany: true,
      required: true,
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "blog-tags",
      hasMany: true,
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      type: "collapsible",
      label: "SEO",
      fields: [
        {
          name: "metaTitle",
          type: "text",
        },
        {
          name: "metaDescription",
          type: "textarea",
        },
        {
          name: "ogImage",
          type: "upload",
          relationTo: "blog-media",
        },
        {
          name: "canonicalUrl",
          type: "text",
        },
      ],
    },
  ],
};

