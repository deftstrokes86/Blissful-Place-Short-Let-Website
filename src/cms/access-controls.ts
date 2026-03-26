import type { Access } from "payload";

import {
  buildBlogDraftWriteConstraint,
  buildBlogReadAccessConstraint,
  canCreateBlogDraft,
  canManageBlog,
  canManageCmsUsers,
  canManageInventory,
  canReadBlogCollections,
  canReadInventory,
  getCmsRoleFromRequestUser,
  getCmsUserIdFromRequestUser,
} from "../server/cms/cms-access";

interface AccessArgsLike {
  req?: {
    user?: unknown;
    url?: unknown;
    originalUrl?: unknown;
    path?: unknown;
    route?: unknown;
  };
}

function getAccessContext(args: AccessArgsLike | undefined): {
  role: ReturnType<typeof getCmsRoleFromRequestUser>;
  userId: ReturnType<typeof getCmsUserIdFromRequestUser>;
} {
  const user = args?.req?.user;

  return {
    role: getCmsRoleFromRequestUser(user),
    userId: getCmsUserIdFromRequestUser(user),
  };
}

function toRoutePath(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nestedPath = record.path;

    if (typeof nestedPath === "string") {
      return nestedPath;
    }
  }

  return "";
}

function isPublicBlogMediaFileRequest(args: AccessArgsLike | undefined): boolean {
  const request = args?.req;

  if (!request) {
    return false;
  }

  const candidates = [
    toRoutePath(request.url),
    toRoutePath(request.originalUrl),
    toRoutePath(request.path),
    toRoutePath(request.route),
  ];

  return candidates.some((candidate) =>
    candidate.includes("/blog-media/file/")
  );
}

export const blogReadAccess: Access = (args) => {
  const { role, userId } = getAccessContext(args);
  return buildBlogReadAccessConstraint(role, userId);
};

export const blogCollectionReadAccess: Access = (args) => {
  const { role } = getAccessContext(args);
  return canReadBlogCollections(role);
};

export const blogMediaPublicReadAccess: Access = (args) => {
  if (isPublicBlogMediaFileRequest(args)) {
    return true;
  }

  const { role } = getAccessContext(args);
  return canReadBlogCollections(role);
};

export const blogManageAccess: Access = (args) => {
  const { role } = getAccessContext(args);
  return canManageBlog(role);
};

export const blogCreateAccess: Access = (args) => {
  const { role } = getAccessContext(args);
  return canCreateBlogDraft(role);
};

export const blogDraftWriteAccess: Access = (args) => {
  const { role, userId } = getAccessContext(args);
  return buildBlogDraftWriteConstraint(role, userId);
};

export const inventoryReadAccess: Access = (args) => {
  const { role } = getAccessContext(args);
  return canReadInventory(role);
};

export const inventoryManageAccess: Access = (args) => {
  const { role } = getAccessContext(args);
  return canManageInventory(role);
};

export const cmsAdminOnlyAccess: Access = (args) => {
  const { role } = getAccessContext(args);
  return canManageCmsUsers(role);
};
