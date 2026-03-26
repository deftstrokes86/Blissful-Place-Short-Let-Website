import type { ImportMap } from "payload";
import { getPayload } from "payload";

import payloadConfig from "@/cms/payload.config";

export const cmsImportMap: ImportMap = {};
const payloadConfigPromise = Promise.resolve(payloadConfig);

export async function getCmsPayload() {
  return getPayload({
    config: payloadConfigPromise,
    importMap: cmsImportMap,
  });
}
