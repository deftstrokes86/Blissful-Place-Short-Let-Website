"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbClient = getDbClient;
const prisma_1 = require("../server/db/prisma");
// Compatibility wrapper for older imports. Prefer importing from @/server/db/prisma directly.
function getDbClient() {
    return prisma_1.prisma;
}
