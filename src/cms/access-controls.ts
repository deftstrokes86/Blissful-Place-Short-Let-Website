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
} from "@/server/cms/cms-access";

interface AccessArgsLike {
  req?: {
    user?: unknown;
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

export const blogReadAccess: Access = (args) => {
  const { role, userId } = getAccessContext(args);
  return buildBlogReadAccessConstraint(role, userId);
};

export const blogCollectionReadAccess: Access = (args) => {
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
