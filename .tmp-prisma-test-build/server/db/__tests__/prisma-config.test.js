"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const prisma_config_1 = require("../prisma-config");
function testResolvePrismaDatabaseUrlReturnsTrimmedPostgresUrl() {
    const databaseUrl = "postgresql://postgres.user:secret@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require";
    strict_1.default.equal((0, prisma_config_1.resolvePrismaDatabaseUrl)({ DATABASE_URL: `  ${databaseUrl}  ` }), databaseUrl);
}
function testResolvePrismaDatabaseUrlRejectsMissingValue() {
    strict_1.default.throws(() => (0, prisma_config_1.resolvePrismaDatabaseUrl)({}), /DATABASE_URL is required/i);
}
function testResolvePrismaDatabaseUrlRejectsFileUrls() {
    strict_1.default.throws(() => (0, prisma_config_1.resolvePrismaDatabaseUrl)({ DATABASE_URL: "file:./.data/payload.db" }), /Supabase Postgres|file-based database URLs/i);
}
function testResolvePrismaDatabaseUrlRejectsMalformedValues() {
    strict_1.default.throws(() => (0, prisma_config_1.resolvePrismaDatabaseUrl)({ DATABASE_URL: "definitely-not-a-connection-string" }), /valid postgres:\/\/ or postgresql:\/\//i);
}
function testResolvePrismaDatabaseUrlRejectsWrongProtocol() {
    strict_1.default.throws(() => (0, prisma_config_1.resolvePrismaDatabaseUrl)({ DATABASE_URL: "mysql://user:pass@example.com:3306/app" }), /must use a postgres:\/\/ or postgresql:\/\//i);
}
function testResolvePrismaDatabaseUrlRejectsSupabaseUrlWithoutSslModeRequire() {
    strict_1.default.throws(() => (0, prisma_config_1.resolvePrismaDatabaseUrl)({
        DATABASE_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres",
    }), /sslmode=require/i);
}
function testResolvePrismaDatabaseUrlAllowsDirectSupabaseConnectionWithSslModeRequire() {
    const databaseUrl = "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require";
    strict_1.default.equal((0, prisma_config_1.resolvePrismaDatabaseUrl)({ DATABASE_URL: databaseUrl }), databaseUrl);
}
function testResolvePrismaDatabaseUrlRejectsSupabaseTransactionPoolerWithoutPgbouncer() {
    strict_1.default.throws(() => (0, prisma_config_1.resolvePrismaDatabaseUrl)({
        DATABASE_URL: "postgresql://postgres.user:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require",
    }), /6543 without pgbouncer=true/i);
}
function testResolvePrismaDatabaseUrlAllowsSupabaseTransactionPoolerWithPgbouncer() {
    const databaseUrl = "postgresql://postgres.user:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require";
    strict_1.default.equal((0, prisma_config_1.resolvePrismaDatabaseUrl)({ DATABASE_URL: databaseUrl }), databaseUrl);
}
function testResolvePrismaLogLevelsFollowEnvironment() {
    strict_1.default.deepEqual((0, prisma_config_1.resolvePrismaLogLevels)({ NODE_ENV: "development" }), ["warn", "error"]);
    strict_1.default.deepEqual((0, prisma_config_1.resolvePrismaLogLevels)({ NODE_ENV: "production" }), ["error"]);
}
function testResolvePrismaClientOptionsInjectsValidatedDatabaseUrl() {
    const databaseUrl = "postgres://postgres.user:secret@db.example.supabase.co:5432/postgres?sslmode=require";
    const options = (0, prisma_config_1.resolvePrismaClientOptions)({
        DATABASE_URL: ` ${databaseUrl} `,
        NODE_ENV: "production",
    });
    strict_1.default.deepEqual(options.datasources, {
        db: {
            url: databaseUrl,
        },
    });
    strict_1.default.deepEqual(options.log, ["error"]);
}
function run() {
    testResolvePrismaDatabaseUrlReturnsTrimmedPostgresUrl();
    testResolvePrismaDatabaseUrlRejectsMissingValue();
    testResolvePrismaDatabaseUrlRejectsFileUrls();
    testResolvePrismaDatabaseUrlRejectsMalformedValues();
    testResolvePrismaDatabaseUrlRejectsWrongProtocol();
    testResolvePrismaDatabaseUrlRejectsSupabaseUrlWithoutSslModeRequire();
    testResolvePrismaDatabaseUrlAllowsDirectSupabaseConnectionWithSslModeRequire();
    testResolvePrismaDatabaseUrlRejectsSupabaseTransactionPoolerWithoutPgbouncer();
    testResolvePrismaDatabaseUrlAllowsSupabaseTransactionPoolerWithPgbouncer();
    testResolvePrismaLogLevelsFollowEnvironment();
    testResolvePrismaClientOptionsInjectsValidatedDatabaseUrl();
    console.log("prisma-config: ok");
}
run();
