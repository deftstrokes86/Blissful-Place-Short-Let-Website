"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_module_1 = require("node:module");
process.env.DATABASE_URL =
    (_a = process.env.DATABASE_URL) !== null && _a !== void 0 ? _a : "postgresql://postgres:bootstrap-secret@db.bootstrap.supabase.co:5432/postgres?sslmode=require";
const nodeRequire = (0, node_module_1.createRequire)(__filename);
const prismaModule = nodeRequire("../prisma");
const { createPrismaClient, PrismaInitializationError } = prismaModule;
class ThrowingPrismaClient {
    constructor() {
        throw new Error("Mock Prisma engine bootstrap failure.");
    }
}
function testCreatePrismaClientWrapsMissingDatabaseUrl() {
    strict_1.default.throws(() => createPrismaClient({}), (error) => {
        (0, strict_1.default)(error instanceof PrismaInitializationError);
        strict_1.default.match(error.message, /Prisma client initialization failed before the app could access the database/i);
        strict_1.default.match(error.message, /DATABASE_URL is required/i);
        strict_1.default.match(error.message, /repo root \.env/i);
        return true;
    });
}
function testCreatePrismaClientWrapsMalformedDatabaseUrl() {
    strict_1.default.throws(() => createPrismaClient({ DATABASE_URL: "not-a-real-url" }), (error) => {
        (0, strict_1.default)(error instanceof PrismaInitializationError);
        strict_1.default.match(error.message, /DATABASE_URL must be a valid postgres:\/\/ or postgresql:\/\//i);
        strict_1.default.match(error.message, /DATABASE_URL could not be parsed/i);
        return true;
    });
}
function testCreatePrismaClientWrapsBootstrapConstructorFailureWithoutLeakingSecrets() {
    strict_1.default.throws(() => createPrismaClient({
        DATABASE_URL: "postgresql://postgres.user:super-secret@db.example.supabase.co:5432/postgres?sslmode=require",
    }, ThrowingPrismaClient), (error) => {
        (0, strict_1.default)(error instanceof PrismaInitializationError);
        strict_1.default.match(error.message, /Mock Prisma engine bootstrap failure/i);
        strict_1.default.match(error.message, /Connection target: db\.example\.supabase\.co:5432\/postgres\?sslmode=require/i);
        strict_1.default.doesNotMatch(error.message, /super-secret/);
        strict_1.default.doesNotMatch(error.message, /postgres\.user/);
        return true;
    });
}
function run() {
    testCreatePrismaClientWrapsMissingDatabaseUrl();
    testCreatePrismaClientWrapsMalformedDatabaseUrl();
    testCreatePrismaClientWrapsBootstrapConstructorFailureWithoutLeakingSecrets();
    console.log("prisma-bootstrap: ok");
}
run();
