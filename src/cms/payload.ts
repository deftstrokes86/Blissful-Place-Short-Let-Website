import type { ImportMap } from "payload";
import { getPayload } from "payload";

import { CollectionCards } from "@payloadcms/next/rsc";
import {
  AlignFeatureClient,
  BlockquoteFeatureClient,
  BoldFeatureClient,
  ChecklistFeatureClient,
  FixedToolbarFeatureClient,
  HeadingFeatureClient,
  HorizontalRuleFeatureClient,
  IndentFeatureClient,
  InlineCodeFeatureClient,
  InlineToolbarFeatureClient,
  ItalicFeatureClient,
  LinkFeatureClient,
  OrderedListFeatureClient,
  ParagraphFeatureClient,
  RelationshipFeatureClient,
  StrikethroughFeatureClient,
  SubscriptFeatureClient,
  SuperscriptFeatureClient,
  UnderlineFeatureClient,
  UnorderedListFeatureClient,
  UploadFeatureClient,
} from "@payloadcms/richtext-lexical/client";
import {
  LexicalDiffComponent,
  RscEntryLexicalCell,
  RscEntryLexicalField,
} from "@payloadcms/richtext-lexical/rsc";

import payloadConfig from "./payload.config";

export const cmsImportMap: ImportMap = {
  "@payloadcms/next/rsc#CollectionCards": CollectionCards,
  "@payloadcms/richtext-lexical/client#AlignFeatureClient": AlignFeatureClient,
  "@payloadcms/richtext-lexical/client#BlockquoteFeatureClient": BlockquoteFeatureClient,
  "@payloadcms/richtext-lexical/client#BoldFeatureClient": BoldFeatureClient,
  "@payloadcms/richtext-lexical/client#ChecklistFeatureClient": ChecklistFeatureClient,
  "@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient": FixedToolbarFeatureClient,
  "@payloadcms/richtext-lexical/client#HeadingFeatureClient": HeadingFeatureClient,
  "@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient": HorizontalRuleFeatureClient,
  "@payloadcms/richtext-lexical/client#IndentFeatureClient": IndentFeatureClient,
  "@payloadcms/richtext-lexical/client#InlineCodeFeatureClient": InlineCodeFeatureClient,
  "@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient": InlineToolbarFeatureClient,
  "@payloadcms/richtext-lexical/client#ItalicFeatureClient": ItalicFeatureClient,
  "@payloadcms/richtext-lexical/client#LinkFeatureClient": LinkFeatureClient,
  "@payloadcms/richtext-lexical/client#OrderedListFeatureClient": OrderedListFeatureClient,
  "@payloadcms/richtext-lexical/client#ParagraphFeatureClient": ParagraphFeatureClient,
  "@payloadcms/richtext-lexical/client#RelationshipFeatureClient": RelationshipFeatureClient,
  "@payloadcms/richtext-lexical/client#StrikethroughFeatureClient": StrikethroughFeatureClient,
  "@payloadcms/richtext-lexical/client#SubscriptFeatureClient": SubscriptFeatureClient,
  "@payloadcms/richtext-lexical/client#SuperscriptFeatureClient": SuperscriptFeatureClient,
  "@payloadcms/richtext-lexical/client#UnderlineFeatureClient": UnderlineFeatureClient,
  "@payloadcms/richtext-lexical/client#UnorderedListFeatureClient": UnorderedListFeatureClient,
  "@payloadcms/richtext-lexical/client#UploadFeatureClient": UploadFeatureClient,
  "@payloadcms/richtext-lexical/rsc#LexicalDiffComponent": LexicalDiffComponent,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField,
};
const payloadConfigPromise = Promise.resolve(payloadConfig);

export async function getCmsPayload() {
  return getPayload({
    config: payloadConfigPromise,
    importMap: cmsImportMap,
  });
}
