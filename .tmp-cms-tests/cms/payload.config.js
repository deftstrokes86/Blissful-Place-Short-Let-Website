"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const db_postgres_1 = require("@payloadcms/db-postgres");
const db_sqlite_1 = require("@payloadcms/db-sqlite");
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const storage_s3_1 = require("@payloadcms/storage-s3");
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
const payloadEnvironment = (_d = (_c = (_b = process.env.NODE_ENV) === null || _b === void 0 ? void 0 : _b.trim()) === null || _c === void 0 ? void 0 : _c.toLowerCase()) !== null && _d !== void 0 ? _d : "development";
const payloadIsProduction = payloadEnvironment === "production";
const payloadIsDevelopment = !payloadIsProduction;
const payloadIsProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const payloadPrimaryDatabaseUrl = (_e = process.env.DATABASE_URL) === null || _e === void 0 ? void 0 : _e.trim();
const payloadDatabaseUrlOverride = (_f = process.env.PAYLOAD_DATABASE_URL) === null || _f === void 0 ? void 0 : _f.trim();
const payloadDefaultSqliteUrl = "file:./.data/payload.db";
const payloadAutoPushRaw = (_h = (_g = process.env.PAYLOAD_AUTO_PUSH_SCHEMA) === null || _g === void 0 ? void 0 : _g.trim()) === null || _h === void 0 ? void 0 : _h.toLowerCase();
const payloadAutoPushOverride = payloadAutoPushRaw === undefined ? undefined : payloadAutoPushRaw === "true";
const payloadAllowProductionSqlite = ((_k = (_j = process.env.PAYLOAD_ALLOW_PRODUCTION_SQLITE) === null || _j === void 0 ? void 0 : _j.trim()) === null || _k === void 0 ? void 0 : _k.toLowerCase()) === "true";
const payloadMediaBucket = (_l = process.env.PAYLOAD_MEDIA_S3_BUCKET) === null || _l === void 0 ? void 0 : _l.trim();
const payloadMediaRegion = (_m = process.env.PAYLOAD_MEDIA_S3_REGION) === null || _m === void 0 ? void 0 : _m.trim();
const payloadMediaEndpointOverride = (_o = process.env.PAYLOAD_MEDIA_S3_ENDPOINT) === null || _o === void 0 ? void 0 : _o.trim();
const payloadMediaAccessKeyId = (_p = process.env.PAYLOAD_MEDIA_S3_ACCESS_KEY_ID) === null || _p === void 0 ? void 0 : _p.trim();
const payloadMediaSecretAccessKey = (_q = process.env.PAYLOAD_MEDIA_S3_SECRET_ACCESS_KEY) === null || _q === void 0 ? void 0 : _q.trim();
const payloadMediaForcePathStyleRaw = (_s = (_r = process.env.PAYLOAD_MEDIA_S3_FORCE_PATH_STYLE) === null || _r === void 0 ? void 0 : _r.trim()) === null || _s === void 0 ? void 0 : _s.toLowerCase();
const payloadMediaForcePathStyle = payloadMediaForcePathStyleRaw === undefined ? true : payloadMediaForcePathStyleRaw === "true";
const payloadAllowProductionLocalMedia = ((_u = (_t = process.env.PAYLOAD_ALLOW_PRODUCTION_LOCAL_MEDIA) === null || _t === void 0 ? void 0 : _t.trim()) === null || _u === void 0 ? void 0 : _u.toLowerCase()) === "true";
function hasConfiguredValue(value) {
    return typeof value === "string" && value.trim().length > 0;
}
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
function resolvePayloadDatabaseUrl() {
    if (payloadDatabaseUrlOverride) {
        return payloadDatabaseUrlOverride;
    }
    if (payloadIsProduction && payloadPrimaryDatabaseUrl) {
        return payloadPrimaryDatabaseUrl;
    }
    return payloadDefaultSqliteUrl;
}
function resolvePayloadDatabaseKind(databaseUrl) {
    return databaseUrl.startsWith("file:") ? "sqlite" : "postgres";
}
function resolvePayloadMediaStorageEndpoint() {
    if (hasConfiguredValue(payloadMediaEndpointOverride)) {
        return payloadMediaEndpointOverride;
    }
    if (hasConfiguredValue(payloadMediaRegion)) {
        return `https://s3.${payloadMediaRegion}.amazonaws.com`;
    }
    return null;
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
const payloadDatabaseUrl = resolvePayloadDatabaseUrl();
const payloadResolvedDatabaseKind = resolvePayloadDatabaseKind(payloadDatabaseUrl);
const payloadResolvedMediaStorageEndpoint = resolvePayloadMediaStorageEndpoint();
const payloadMediaStorageRequiredValues = [
    payloadMediaBucket,
    payloadMediaRegion,
    payloadMediaAccessKeyId,
    payloadMediaSecretAccessKey,
    payloadResolvedMediaStorageEndpoint,
];
const payloadMediaStorageConfiguredCount = payloadMediaStorageRequiredValues.filter(hasConfiguredValue).length;
const payloadMediaStorageEnabled = payloadMediaStorageConfiguredCount === payloadMediaStorageRequiredValues.length;
const payloadMediaStorageHasPartialConfig = payloadMediaStorageConfiguredCount > 0 && !payloadMediaStorageEnabled;
if (payloadMediaStorageHasPartialConfig) {
    throw new Error("Payload CMS S3 media storage is partially configured. Set PAYLOAD_MEDIA_S3_BUCKET, PAYLOAD_MEDIA_S3_REGION, PAYLOAD_MEDIA_S3_ACCESS_KEY_ID, PAYLOAD_MEDIA_S3_SECRET_ACCESS_KEY, and optionally PAYLOAD_MEDIA_S3_ENDPOINT for non-AWS providers.");
}
if (payloadIsProduction &&
    !payloadIsProductionBuild &&
    payloadResolvedDatabaseKind === "sqlite" &&
    !payloadAllowProductionSqlite) {
    throw new Error("Payload CMS is configured to use SQLite in production. Set PAYLOAD_DATABASE_URL to a persistent Postgres connection string, rely on DATABASE_URL, or set PAYLOAD_ALLOW_PRODUCTION_SQLITE=true only when production has persistent disk.");
}
if (payloadIsProduction &&
    !payloadIsProductionBuild &&
    !payloadMediaStorageEnabled &&
    !payloadAllowProductionLocalMedia) {
    throw new Error("Payload CMS blog media is configured to use local filesystem storage in production. Set PAYLOAD_MEDIA_S3_BUCKET, PAYLOAD_MEDIA_S3_REGION, PAYLOAD_MEDIA_S3_ACCESS_KEY_ID, PAYLOAD_MEDIA_S3_SECRET_ACCESS_KEY, and PAYLOAD_MEDIA_S3_ENDPOINT for persistent object storage, or set PAYLOAD_ALLOW_PRODUCTION_LOCAL_MEDIA=true only when production has persistent disk.");
}
const payloadSqliteFilePath = payloadResolvedDatabaseKind === "sqlite" ? resolveSqliteFilePath(payloadDatabaseUrl) : null;
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
const payloadShouldPushSqliteSchema = payloadAutoPushSchema && (payloadBootstrapPush || payloadSchemaDriftPush);
const payloadShouldPushPostgresSchema = payloadAutoPushSchema;
const payloadDatabaseAdapter = payloadResolvedDatabaseKind === "sqlite"
    ? (0, db_sqlite_1.sqliteAdapter)({
        client: {
            url: payloadDatabaseUrl,
        },
        // Keep runtime non-interactive by default.
        // Automatically bootstrap schema when the local SQLite DB is new or drifted.
        push: payloadShouldPushSqliteSchema,
    })
    : (0, db_postgres_1.postgresAdapter)({
        pool: {
            connectionString: payloadDatabaseUrl,
        },
        // Production never auto-pushes Postgres schemas, but local env overrides should stay predictable.
        push: payloadShouldPushPostgresSchema,
    });
const payloadPlugins = payloadMediaStorageEnabled
    ? [
        (0, storage_s3_1.s3Storage)({
            acl: "public-read",
            bucket: payloadMediaBucket,
            collections: {
                [BlogMedia_1.BlogMediaCollection.slug]: true,
            },
            config: {
                credentials: {
                    accessKeyId: payloadMediaAccessKeyId,
                    secretAccessKey: payloadMediaSecretAccessKey,
                },
                endpoint: payloadResolvedMediaStorageEndpoint,
                forcePathStyle: payloadMediaForcePathStyle,
                region: payloadMediaRegion,
            },
        }),
    ]
    : [];
const payloadConfig = (0, payload_1.buildConfig)({
    secret: payloadSecret,
    editor: (0, richtext_lexical_1.lexicalEditor)(),
    db: payloadDatabaseAdapter,
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
    plugins: payloadPlugins,
    typescript: {
        outputFile: node_path_1.default.resolve(process.cwd(), "src/types/payload-types"),
    },
});
exports.default = payloadConfig;
