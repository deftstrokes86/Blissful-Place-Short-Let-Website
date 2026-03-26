import type { ReactNode } from "react";

import { RootLayout, handleServerFunctions } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";

import { cmsImportMap } from "@/cms/payload";
import payloadConfig from "@/cms/payload.config";

const cmsServerFunction: ServerFunctionClient = (args) =>
  handleServerFunctions({
    ...args,
    config: payloadConfig,
    importMap: cmsImportMap,
  });

export default async function CmsLayout({ children }: { children: ReactNode }) {
  return RootLayout({
    children,
    config: Promise.resolve(payloadConfig),
    importMap: cmsImportMap,
    serverFunction: cmsServerFunction,
  });
}
