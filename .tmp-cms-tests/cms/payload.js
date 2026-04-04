"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmsImportMap = void 0;
exports.getCmsPayload = getCmsPayload;
const payload_1 = require("payload");
const rsc_1 = require("@payloadcms/next/rsc");
const client_1 = require("@payloadcms/richtext-lexical/client");
const rsc_2 = require("@payloadcms/richtext-lexical/rsc");
const payload_config_1 = __importDefault(require("./payload.config"));
exports.cmsImportMap = {
    "@payloadcms/next/rsc#CollectionCards": rsc_1.CollectionCards,
    "@payloadcms/richtext-lexical/client#AlignFeatureClient": client_1.AlignFeatureClient,
    "@payloadcms/richtext-lexical/client#BlockquoteFeatureClient": client_1.BlockquoteFeatureClient,
    "@payloadcms/richtext-lexical/client#BoldFeatureClient": client_1.BoldFeatureClient,
    "@payloadcms/richtext-lexical/client#ChecklistFeatureClient": client_1.ChecklistFeatureClient,
    "@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient": client_1.FixedToolbarFeatureClient,
    "@payloadcms/richtext-lexical/client#HeadingFeatureClient": client_1.HeadingFeatureClient,
    "@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient": client_1.HorizontalRuleFeatureClient,
    "@payloadcms/richtext-lexical/client#IndentFeatureClient": client_1.IndentFeatureClient,
    "@payloadcms/richtext-lexical/client#InlineCodeFeatureClient": client_1.InlineCodeFeatureClient,
    "@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient": client_1.InlineToolbarFeatureClient,
    "@payloadcms/richtext-lexical/client#ItalicFeatureClient": client_1.ItalicFeatureClient,
    "@payloadcms/richtext-lexical/client#LinkFeatureClient": client_1.LinkFeatureClient,
    "@payloadcms/richtext-lexical/client#OrderedListFeatureClient": client_1.OrderedListFeatureClient,
    "@payloadcms/richtext-lexical/client#ParagraphFeatureClient": client_1.ParagraphFeatureClient,
    "@payloadcms/richtext-lexical/client#RelationshipFeatureClient": client_1.RelationshipFeatureClient,
    "@payloadcms/richtext-lexical/client#StrikethroughFeatureClient": client_1.StrikethroughFeatureClient,
    "@payloadcms/richtext-lexical/client#SubscriptFeatureClient": client_1.SubscriptFeatureClient,
    "@payloadcms/richtext-lexical/client#SuperscriptFeatureClient": client_1.SuperscriptFeatureClient,
    "@payloadcms/richtext-lexical/client#UnderlineFeatureClient": client_1.UnderlineFeatureClient,
    "@payloadcms/richtext-lexical/client#UnorderedListFeatureClient": client_1.UnorderedListFeatureClient,
    "@payloadcms/richtext-lexical/client#UploadFeatureClient": client_1.UploadFeatureClient,
    "@payloadcms/richtext-lexical/rsc#LexicalDiffComponent": rsc_2.LexicalDiffComponent,
    "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": rsc_2.RscEntryLexicalCell,
    "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": rsc_2.RscEntryLexicalField,
};
const payloadConfigPromise = Promise.resolve(payload_config_1.default);
async function getCmsPayload() {
    return (0, payload_1.getPayload)({
        config: payloadConfigPromise,
        importMap: exports.cmsImportMap,
    });
}
