"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmsImportMap = void 0;
exports.getCmsPayload = getCmsPayload;
const payload_1 = require("payload");
const rsc_1 = require("@payloadcms/next/rsc");
const rsc_2 = require("@payloadcms/richtext-lexical/rsc");
const payload_config_1 = __importDefault(require("./payload.config"));
exports.cmsImportMap = {
    "@payloadcms/next/rsc#CollectionCards": rsc_1.CollectionCards,
    "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": rsc_2.RscEntryLexicalField,
};
const payloadConfigPromise = Promise.resolve(payload_config_1.default);
async function getCmsPayload() {
    return (0, payload_1.getPayload)({
        config: payloadConfigPromise,
        importMap: exports.cmsImportMap,
    });
}
