"use server";

import { handleServerFunctions } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";

import { cmsImportMap } from "@/cms/payload";
import payloadConfig from "@/cms/payload.config";

export const cmsServerFunction: ServerFunctionClient = async (args) => {
  return handleServerFunctions({
    ...args,
    config: payloadConfig,
    importMap: cmsImportMap,
  });
};
