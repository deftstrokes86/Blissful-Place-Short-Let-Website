"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const cms_access_1 = require("../cms-access");
function readSource(relativePath) {
    return (0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), relativePath), "utf8");
}
async function testCmsRoleGuards() {
    strict_1.default.equal((0, cms_access_1.isCmsRole)("admin"), true);
    strict_1.default.equal((0, cms_access_1.isCmsRole)("blog_manager"), true);
    strict_1.default.equal((0, cms_access_1.isCmsRole)("inventory_manager"), true);
    strict_1.default.equal((0, cms_access_1.isCmsRole)("author"), true);
    strict_1.default.equal((0, cms_access_1.isCmsRole)("cms_admin"), false);
}
async function testUsersCollectionRoleFieldAndAuth() {
    const source = readSource("src/cms/collections/CmsUsers.ts");
    strict_1.default.ok(source.includes("auth: true"));
    strict_1.default.ok(source.includes('value: "admin"'));
    strict_1.default.ok(source.includes('value: "inventory_manager"'));
    strict_1.default.ok(source.includes('value: "blog_manager"'));
    strict_1.default.ok(source.includes('value: "author"'));
    strict_1.default.ok(source.includes('defaultValue: "author"'));
}
async function testRoleExtractionFromRequestUser() {
    strict_1.default.equal((0, cms_access_1.getCmsRoleFromRequestUser)({ role: "admin" }), "admin");
    strict_1.default.equal((0, cms_access_1.getCmsRoleFromRequestUser)({ role: "blog_manager" }), "blog_manager");
    strict_1.default.equal((0, cms_access_1.getCmsRoleFromRequestUser)({ role: "staff" }), null);
    strict_1.default.equal((0, cms_access_1.getCmsRoleFromRequestUser)(null), null);
}
async function testInventoryAndBlogDomainBoundaries() {
    strict_1.default.equal((0, cms_access_1.canManageBlog)("admin"), true);
    strict_1.default.equal((0, cms_access_1.canManageInventory)("admin"), true);
    strict_1.default.equal((0, cms_access_1.canReadInventory)("admin"), true);
    strict_1.default.equal((0, cms_access_1.canManageCmsUsers)("admin"), true);
    strict_1.default.equal((0, cms_access_1.canManageBlog)("blog_manager"), true);
    strict_1.default.equal((0, cms_access_1.canManageInventory)("blog_manager"), false);
    strict_1.default.equal((0, cms_access_1.canReadInventory)("blog_manager"), false);
    strict_1.default.equal((0, cms_access_1.canManageCmsUsers)("blog_manager"), false);
    strict_1.default.equal((0, cms_access_1.canManageBlog)("inventory_manager"), false);
    strict_1.default.equal((0, cms_access_1.canManageInventory)("inventory_manager"), true);
    strict_1.default.equal((0, cms_access_1.canReadInventory)("inventory_manager"), true);
    strict_1.default.equal((0, cms_access_1.canManageCmsUsers)("inventory_manager"), false);
    strict_1.default.equal((0, cms_access_1.canManageBlog)("author"), false);
    strict_1.default.equal((0, cms_access_1.canManageInventory)("author"), false);
    strict_1.default.equal((0, cms_access_1.canReadInventory)("author"), false);
    strict_1.default.equal((0, cms_access_1.canManageCmsUsers)("author"), false);
}
async function testBlogReadConstraintStaysPublicSafe() {
    strict_1.default.equal((0, cms_access_1.buildBlogReadAccessConstraint)(null, null), false);
    strict_1.default.equal((0, cms_access_1.buildBlogReadAccessConstraint)("inventory_manager", "inventory-user"), false);
    strict_1.default.equal((0, cms_access_1.buildBlogReadAccessConstraint)("blog_manager", "blog-manager-id"), true);
    strict_1.default.equal((0, cms_access_1.buildBlogReadAccessConstraint)("admin", "admin-id"), true);
    strict_1.default.deepEqual((0, cms_access_1.buildBlogReadAccessConstraint)("author", "author-1"), {
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
async function testAuthorDraftWriteScope() {
    strict_1.default.equal((0, cms_access_1.canCreateBlogDraft)("author"), true);
    strict_1.default.equal((0, cms_access_1.canCreateBlogDraft)("blog_manager"), true);
    strict_1.default.equal((0, cms_access_1.canCreateBlogDraft)("admin"), true);
    strict_1.default.equal((0, cms_access_1.canCreateBlogDraft)("inventory_manager"), false);
    strict_1.default.deepEqual((0, cms_access_1.buildBlogDraftWriteConstraint)("author", "author-1"), {
        and: [
            { author: { equals: "author-1" } },
            { status: { equals: "draft" } },
        ],
    });
    strict_1.default.equal((0, cms_access_1.buildBlogDraftWriteConstraint)("author", null), false);
    strict_1.default.equal((0, cms_access_1.buildBlogDraftWriteConstraint)("blog_manager", "manager-1"), true);
    strict_1.default.equal((0, cms_access_1.buildBlogDraftWriteConstraint)("admin", "admin-1"), true);
    strict_1.default.equal((0, cms_access_1.buildBlogDraftWriteConstraint)("inventory_manager", "inventory-1"), false);
    strict_1.default.equal((0, cms_access_1.canSetBlogStatus)("author", "draft"), true);
    strict_1.default.equal((0, cms_access_1.canSetBlogStatus)("author", "published"), false);
    strict_1.default.equal((0, cms_access_1.canSetBlogStatus)("blog_manager", "published"), true);
    strict_1.default.equal((0, cms_access_1.canSetBlogStatus)("admin", "published"), true);
}
async function run() {
    await testCmsRoleGuards();
    await testUsersCollectionRoleFieldAndAuth();
    await testRoleExtractionFromRequestUser();
    await testInventoryAndBlogDomainBoundaries();
    await testBlogReadConstraintStaysPublicSafe();
    await testAuthorDraftWriteScope();
    console.log("cms-access: ok");
}
void run();
