import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildBlogDraftWriteConstraint,
  buildBlogReadAccessConstraint,
  canCreateBlogDraft,
  canManageBlog,
  canManageCmsUsers,
  canManageInventory,
  canReadInventory,
  canSetBlogStatus,
  getCmsRoleFromRequestUser,
  isCmsRole,
} from "../cms-access";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testCmsRoleGuards(): Promise<void> {
  assert.equal(isCmsRole("admin"), true);
  assert.equal(isCmsRole("blog_manager"), true);
  assert.equal(isCmsRole("inventory_manager"), true);
  assert.equal(isCmsRole("author"), true);
  assert.equal(isCmsRole("cms_admin"), false);
}

async function testUsersCollectionRoleFieldAndAuth(): Promise<void> {
  const source = readSource("src/cms/collections/CmsUsers.ts");

  assert.ok(source.includes("auth: true"));
  assert.ok(source.includes('value: "admin"'));
  assert.ok(source.includes('value: "inventory_manager"'));
  assert.ok(source.includes('value: "blog_manager"'));
  assert.ok(source.includes('value: "author"'));
  assert.ok(source.includes('defaultValue: "author"'));
}

async function testRoleExtractionFromRequestUser(): Promise<void> {
  assert.equal(getCmsRoleFromRequestUser({ role: "admin" }), "admin");
  assert.equal(getCmsRoleFromRequestUser({ role: "blog_manager" }), "blog_manager");
  assert.equal(getCmsRoleFromRequestUser({ role: "staff" }), null);
  assert.equal(getCmsRoleFromRequestUser(null), null);
}

async function testInventoryAndBlogDomainBoundaries(): Promise<void> {
  assert.equal(canManageBlog("admin"), true);
  assert.equal(canManageInventory("admin"), true);
  assert.equal(canReadInventory("admin"), true);
  assert.equal(canManageCmsUsers("admin"), true);

  assert.equal(canManageBlog("blog_manager"), true);
  assert.equal(canManageInventory("blog_manager"), false);
  assert.equal(canReadInventory("blog_manager"), false);
  assert.equal(canManageCmsUsers("blog_manager"), false);

  assert.equal(canManageBlog("inventory_manager"), false);
  assert.equal(canManageInventory("inventory_manager"), true);
  assert.equal(canReadInventory("inventory_manager"), true);
  assert.equal(canManageCmsUsers("inventory_manager"), false);

  assert.equal(canManageBlog("author"), false);
  assert.equal(canManageInventory("author"), false);
  assert.equal(canReadInventory("author"), false);
  assert.equal(canManageCmsUsers("author"), false);
}

async function testBlogReadConstraintStaysPublicSafe(): Promise<void> {
  assert.equal(buildBlogReadAccessConstraint(null, null), false);
  assert.equal(buildBlogReadAccessConstraint("inventory_manager", "inventory-user"), false);

  assert.equal(buildBlogReadAccessConstraint("blog_manager", "blog-manager-id"), true);
  assert.equal(buildBlogReadAccessConstraint("admin", "admin-id"), true);
  assert.deepEqual(buildBlogReadAccessConstraint("author", "author-1"), {
    or: [
      { status: { equals: "published" } },
      {
        and: [
          { author: { equals: "author-1" } },
          { status: { equals: "draft" } },
        ],
      },
    ],
  });
}

async function testAuthorDraftWriteScope(): Promise<void> {
  assert.equal(canCreateBlogDraft("author"), true);
  assert.equal(canCreateBlogDraft("blog_manager"), true);
  assert.equal(canCreateBlogDraft("admin"), true);
  assert.equal(canCreateBlogDraft("inventory_manager"), false);

  assert.deepEqual(buildBlogDraftWriteConstraint("author", "author-1"), {
    and: [
      { author: { equals: "author-1" } },
      { status: { equals: "draft" } },
    ],
  });
  assert.equal(buildBlogDraftWriteConstraint("author", null), false);
  assert.equal(buildBlogDraftWriteConstraint("blog_manager", "manager-1"), true);
  assert.equal(buildBlogDraftWriteConstraint("admin", "admin-1"), true);
  assert.equal(buildBlogDraftWriteConstraint("inventory_manager", "inventory-1"), false);

  assert.equal(canSetBlogStatus("author", "draft"), true);
  assert.equal(canSetBlogStatus("author", "published"), false);
  assert.equal(canSetBlogStatus("blog_manager", "published"), true);
  assert.equal(canSetBlogStatus("admin", "published"), true);
}

async function run(): Promise<void> {
  await testCmsRoleGuards();
  await testUsersCollectionRoleFieldAndAuth();
  await testRoleExtractionFromRequestUser();
  await testInventoryAndBlogDomainBoundaries();
  await testBlogReadConstraintStaysPublicSafe();
  await testAuthorDraftWriteScope();

  console.log("cms-access: ok");
}

void run();



