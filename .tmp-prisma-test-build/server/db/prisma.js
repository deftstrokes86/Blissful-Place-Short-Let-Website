"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.PrismaInitializationError = void 0;
exports.createPrismaInitializationError = createPrismaInitializationError;
exports.createPrismaClient = createPrismaClient;
const client_1 = require("@prisma/client");
const prisma_config_1 = require("./prisma-config");
const globalForPrisma = globalThis;
function getPrismaRuntimeGuidance(env) {
    return env.NODE_ENV === "production"
        ? "If this is running on Hostinger or another deployed environment, set DATABASE_URL in the host environment and redeploy."
        : "If this is local development, keep DATABASE_URL in the repo root .env or provide it in the server runtime environment before starting the app.";
}
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
class PrismaInitializationError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = "PrismaInitializationError";
        this.cause = cause;
    }
}
exports.PrismaInitializationError = PrismaInitializationError;
function createPrismaInitializationError(error, env = process.env) {
    const targetDescription = (0, prisma_config_1.describePrismaDatabaseTarget)(env);
    const targetClause = targetDescription.startsWith("DATABASE_URL") ? `${targetDescription}.` : `Connection target: ${targetDescription}.`;
    return new PrismaInitializationError(`Prisma client initialization failed before the app could access the database. ${getErrorMessage(error)} ${targetClause} ${getPrismaRuntimeGuidance(env)}`, error);
}
function createPrismaClient(env = process.env, PrismaCtor = client_1.PrismaClient) {
    try {
        return new PrismaCtor((0, prisma_config_1.resolvePrismaClientOptions)(env));
    }
    catch (error) {
        throw createPrismaInitializationError(error, env);
    }
}
exports.prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : createPrismaClient();
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
