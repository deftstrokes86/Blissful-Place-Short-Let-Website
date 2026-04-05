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

import { describePayloadDatabaseDependency } from "./payload-database-config";

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

type PayloadConfig = Awaited<(typeof import("./payload.config"))["default"]>;

let payloadConfigPromise: Promise<PayloadConfig> | null = null;

export class PayloadInitializationError extends Error {
  cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "PayloadInitializationError";
    this.cause = cause;
  }
}

function buildPayloadInitializationMessage(): string {
  const dependency = describePayloadDatabaseDependency();

  return [
    "Payload CMS failed to initialize before the app could read blog or CMS content.",
    dependency.summary,
    "In the normal production path, leave PAYLOAD_DATABASE_URL blank so Payload reuses DATABASE_URL.",
    "See docs/payload-blog-database-path.md and docs/production-env-setup.md.",
  ].join(" ");
}

async function loadPayloadConfig(): Promise<PayloadConfig> {
  if (payloadConfigPromise) {
    return payloadConfigPromise;
  }

  const nextPayloadConfigPromise = import("./payload.config")
    .then((module) => module.default)
    .catch((error: unknown) => {
      payloadConfigPromise = null;
      throw error;
    });

  payloadConfigPromise = nextPayloadConfigPromise;

  return nextPayloadConfigPromise;
}

export async function getCmsPayload() {
  try {
    const payloadConfig = await loadPayloadConfig();

    return getPayload({
      config: Promise.resolve(payloadConfig),
      importMap: cmsImportMap,
    });
  } catch (error) {
    throw new PayloadInitializationError(buildPayloadInitializationMessage(), error);
  }
}

