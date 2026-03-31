"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const db_sqlite_1 = require("@payloadcms/db-sqlite");
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const payload_1 = require("payload");
const BlogCategories_1 = require("./collections/BlogCategories");
const BlogMedia_1 = require("./collections/BlogMedia");
const BlogPosts_1 = require("./collections/BlogPosts");
const BlogTags_1 = require("./collections/BlogTags");
const CmsInventoryAlerts_1 = require("./collections/CmsInventoryAlerts");
const CmsInventoryItems_1 = require("./collections/CmsInventoryItems");
const CmsInventoryTemplateItems_1 = require("./collections/CmsInventoryTemplateItems");
const CmsInventoryTemplates_1 = require("./collections/CmsInventoryTemplates");
const CmsMaintenanceIssues_1 = require("./collections/CmsMaintenanceIssues");
const CmsPages_1 = require("./collections/CmsPages");
const CmsUsers_1 = require("./collections/CmsUsers");
const CMS_ADMIN_ROUTE = "/cms";
const CMS_API_ROUTE = "/cms/api";
const payloadSecret = ((_a = process.env.PAYLOAD_SECRET) === null || _a === void 0 ? void 0 : _a.trim()) || "blissful-place-cms-dev-secret";
const payloadDatabaseUrl = ((_b = process.env.PAYLOAD_DATABASE_URL) === null || _b === void 0 ? void 0 : _b.trim()) || "file:./.data/payload.db";
const payloadAutoPushRaw = (_c = process.env.PAYLOAD_AUTO_PUSH_SCHEMA) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase();
const payloadAutoPushOverride = payloadAutoPushRaw === undefined ? undefined : payloadAutoPushRaw === "true";
const payloadIsDevelopment = ((_e = (_d = process.env.NODE_ENV) === null || _d === void 0 ? void 0 : _d.trim().toLowerCase()) !== null && _e !== void 0 ? _e : "development") !== "production";
function loadSqliteDatabaseConstructor() {
    try {
        const runtimeRequire = typeof require === "function" ? require : null;
        if (!runtimeRequire) {
            return null;
        }
        const sqliteModule = runtimeRequire("node:sqlite");
        if (typeof sqliteModule.DatabaseSync === "function") {
            return sqliteModule.DatabaseSync;
        }
    }
    catch (_a) {
        // Ignore runtime environments that do not expose node:sqlite.
    }
    return null;
}
function resolveSqliteFilePath(databaseUrl) {
    if (!databaseUrl.startsWith("file:")) {
        return null;
    }
    const relativePath = databaseUrl.slice("file:".length);
    return node_path_1.default.resolve(process.cwd(), relativePath);
}
function toSqliteCollectionTableName(slug) {
    return slug.replace(/-/g, "_");
}
function hasSchemaDrift(sqliteFilePath, collectionSlugs) {
    if (!node_fs_1.default.existsSync(sqliteFilePath)) {
        return false;
    }
    const DatabaseSync = loadSqliteDatabaseConstructor();
    if (!DatabaseSync) {
        return false;
    }
    const expectedTables = collectionSlugs.map((slug) => toSqliteCollectionTableName(slug));
    const database = new DatabaseSync(sqliteFilePath, { readOnly: true });
    try {
        const tableNames = new Set(database
            .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
            .all()
            .map((row) => (typeof row.name === "string" ? row.name : ""))
            .filter((name) => name.length > 0));
        return expectedTables.some((tableName) => !tableNames.has(tableName));
    }
    catch (_a) {
        // If we cannot inspect schema drift safely, do not force push here.
        return false;
    }
    finally {
        database.close();
    }
}
const payloadSqliteFilePath = resolveSqliteFilePath(payloadDatabaseUrl);
const payloadCollectionSlugs = [
    CmsUsers_1.CmsUsersCollection.slug,
    CmsPages_1.CmsPagesCollection.slug,
    BlogCategories_1.BlogCategoriesCollection.slug,
    BlogTags_1.BlogTagsCollection.slug,
    BlogMedia_1.BlogMediaCollection.slug,
    BlogPosts_1.BlogPostsCollection.slug,
    CmsInventoryItems_1.CmsInventoryItemsCollection.slug,
    CmsInventoryTemplates_1.CmsInventoryTemplatesCollection.slug,
    CmsInventoryTemplateItems_1.CmsInventoryTemplateItemsCollection.slug,
    CmsInventoryAlerts_1.CmsInventoryAlertsCollection.slug,
    CmsMaintenanceIssues_1.CmsMaintenanceIssuesCollection.slug,
];
const payloadBootstrapPush = payloadSqliteFilePath ? !node_fs_1.default.existsSync(payloadSqliteFilePath) : false;
const payloadSchemaDriftPush = payloadSqliteFilePath
    ? hasSchemaDrift(payloadSqliteFilePath, payloadCollectionSlugs)
    : false;
const payloadAutoPushSchema = payloadAutoPushOverride !== null && payloadAutoPushOverride !== void 0 ? payloadAutoPushOverride : payloadIsDevelopment;
const payloadShouldPushSchema = payloadAutoPushSchema && (payloadBootstrapPush || payloadSchemaDriftPush);
const payloadConfig = (0, payload_1.buildConfig)({
    secret: payloadSecret,
    editor: (0, richtext_lexical_1.lexicalEditor)(),
    db: (0, db_sqlite_1.sqliteAdapter)({
        client: {
            url: payloadDatabaseUrl,
        },
        // Keep runtime non-interactive by default.
        // Automatically bootstrap schema when local DB is new, drifted, or when dev-mode auto-push is enabled.
        push: payloadShouldPushSchema,
    }),
    admin: {
        user: CmsUsers_1.CmsUsersCollection.slug,
        suppressHydrationWarning: true,
    },
    routes: {
        admin: CMS_ADMIN_ROUTE,
        api: CMS_API_ROUTE,
    },
    collections: [
        CmsUsers_1.CmsUsersCollection,
        CmsPages_1.CmsPagesCollection,
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
        outputFile: node_path_1.default.resolve(process.cwd(), "src/types/payload-types"),
    },
});
exports.default = payloadConfig;
