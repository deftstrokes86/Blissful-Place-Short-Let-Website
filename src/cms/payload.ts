import type { ImportMap } from "payload";
import { getPayload } from "payload";

import { CollectionCards } from "@payloadcms/next/rsc";
import { RscEntryLexicalField } from "@payloadcms/richtext-lexical/rsc";

import payloadConfig from "./payload.config";

export const cmsImportMap: ImportMap = {
  "@payloadcms/next/rsc#CollectionCards": CollectionCards,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField,
};
const payloadConfigPromise = Promise.resolve(payloadConfig);

export async function getCmsPayload() {
  return getPayload({
    config: payloadConfigPromise,
    importMap: cmsImportMap,
  });
}
