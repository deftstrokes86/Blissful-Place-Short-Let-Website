"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseId = createDatabaseId;
const node_crypto_1 = require("node:crypto");
function createDatabaseId(prefix) {
    return `${prefix}_${(0, node_crypto_1.randomUUID)()}`;
}
