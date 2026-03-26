export const CMS_ROLE_VALUES = ["admin", "inventory_manager", "blog_manager", "author"] as const;

export type CmsRole = (typeof CMS_ROLE_VALUES)[number];

export type PublishedBlogConstraint = { status: { equals: "published" } };
export type OwnDraftBlogConstraint = {
  and: [{ author: { equals: string } }, { status: { equals: "draft" } }];
};
export type BlogReadAccessConstraint =
  | true
  | false
  | PublishedBlogConstraint
  | { or: [PublishedBlogConstraint, OwnDraftBlogConstraint] };
export type BlogDraftWriteConstraint = true | false | OwnDraftBlogConstraint;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function isCmsRole(value: unknown): value is CmsRole {
  return typeof value === "string" && CMS_ROLE_VALUES.includes(value as CmsRole);
}

export function getCmsRoleFromRequestUser(user: unknown): CmsRole | null {
  if (!isRecord(user)) {
    return null;
  }

  const role = user.role;
  return isCmsRole(role) ? role : null;
}

export function getCmsUserIdFromRequestUser(user: unknown): string | null {
  if (!isRecord(user)) {
    return null;
  }

  const userId = user.id;
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

export function canManageBlog(role: CmsRole | null): boolean {
  return role === "admin" || role === "blog_manager";
}

export function canReadBlogCollections(role: CmsRole | null): boolean {
  return canManageBlog(role) || role === "author";
}

export function canCreateBlogDraft(role: CmsRole | null): boolean {
  return canManageBlog(role) || role === "author";
}

export function canSetBlogStatus(role: CmsRole | null, status: "draft" | "published"): boolean {
  if (status === "draft") {
    return canCreateBlogDraft(role);
  }

  return canManageBlog(role);
}

export function canManageInventory(role: CmsRole | null): boolean {
  return role === "admin" || role === "inventory_manager";
}

export function canReadInventory(role: CmsRole | null): boolean {
  return canManageInventory(role);
}

export function canManageCmsUsers(role: CmsRole | null): boolean {
  return role === "admin";
}

function buildOwnDraftConstraint(userId: string): OwnDraftBlogConstraint {
  return {
    and: [
      { author: { equals: userId } },
      { status: { equals: "draft" } },
    ],
  };
}

export function buildBlogReadAccessConstraint(role: CmsRole | null, userId: string | null): BlogReadAccessConstraint {
  if (canManageBlog(role)) {
    return true;
  }

  if (role === "author" && userId) {
    const publishedConstraint: PublishedBlogConstraint = {
      status: {
        equals: "published",
      },
    };

    return {
      or: [publishedConstraint, buildOwnDraftConstraint(userId)],
    };
  }

  // Keep CMS blog collections internal to authenticated blog roles.
  // Public pages fetch published content via explicit server-side queries.
  return false;
}

export function buildBlogDraftWriteConstraint(role: CmsRole | null, userId: string | null): BlogDraftWriteConstraint {
  if (canManageBlog(role)) {
    return true;
  }

  if (role === "author" && userId) {
    return buildOwnDraftConstraint(userId);
  }

  return false;
}
