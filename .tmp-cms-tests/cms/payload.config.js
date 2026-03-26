"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const db_sqlite_1 = require("@payloadcms/db-sqlite");
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const payload_1 = require("payload");
const BlogCategories_1 = require("@/cms/collections/BlogCategories");
const BlogMedia_1 = require("@/cms/collections/BlogMedia");
const BlogPosts_1 = require("@/cms/collections/BlogPosts");
const BlogTags_1 = require("@/cms/collections/BlogTags");
const CmsInventoryAlerts_1 = require("@/cms/collections/CmsInventoryAlerts");
const CmsInventoryItems_1 = require("@/cms/collections/CmsInventoryItems");
const CmsInventoryTemplateItems_1 = require("@/cms/collections/CmsInventoryTemplateItems");
const CmsInventoryTemplates_1 = require("@/cms/collections/CmsInventoryTemplates");
const CmsMaintenanceIssues_1 = require("@/cms/collections/CmsMaintenanceIssues");
const CmsUsers_1 = require("@/cms/collections/CmsUsers");
const CMS_ADMIN_ROUTE = "/cms";
const CMS_API_ROUTE = "/cms/api";
const payloadSecret = ((_a = process.env.PAYLOAD_SECRET) === null || _a === void 0 ? void 0 : _a.trim()) || "blissful-place-cms-dev-secret";
const payloadDatabaseUrl = ((_b = process.env.PAYLOAD_DATABASE_URL) === null || _b === void 0 ? void 0 : _b.trim()) || "file:./.data/payload.db";
const payloadConfig = (0, payload_1.buildConfig)({
    secret: payloadSecret,
    editor: (0, richtext_lexical_1.lexicalEditor)(),
    db: (0, db_sqlite_1.sqliteAdapter)({
        client: {
            url: payloadDatabaseUrl,
        },
    }),
    admin: {
        user: CmsUsers_1.CmsUsersCollection.slug,
    },
    routes: {
        admin: CMS_ADMIN_ROUTE,
        api: CMS_API_ROUTE,
    },
    collections: [
        CmsUsers_1.CmsUsersCollection,
        BlogCategories_1.BlogCategoriesCollection,
        BlogTags_1.BlogTagsCollection,
        BlogMedia_1.BlogMediaCollection,
        BlogPosts_1.BlogPostsCollection,
        CmsInventoryItems_1.CmsInventoryItemsCollection,
        CmsInventoryTemplates_1.CmsInventoryTemplatesCollection,
        CmsInventoryTemplateItems_1.CmsInventoryTemplateItemsCollection,
        CmsInventoryAlerts_1.CmsInventoryAlertsCollection,
        CmsMaintenanceIssues_1.CmsMaintenanceIssuesCollection,
    ],
    typescript: {
        outputFile: node_path_1.default.resolve(process.cwd(), "src/types/payload-types.ts"),
    },
});
exports.default = payloadConfig;
