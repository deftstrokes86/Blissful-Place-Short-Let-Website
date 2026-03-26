import "@payloadcms/next/css";

import type { ReactNode } from "react";

import { RootLayout } from "@payloadcms/next/layouts";

import { cmsImportMap } from "@/cms/payload";
import payloadConfig from "@/cms/payload.config";
import { cmsServerFunction } from "./cms/server-function";

interface CmsRootLayoutProps {
  children: ReactNode;
}

export { metadata } from "@payloadcms/next/layouts";

export default async function CmsRootLayout({ children }: CmsRootLayoutProps) {
  return RootLayout({
    children,
    config: Promise.resolve(payloadConfig),
    importMap: cmsImportMap,
    serverFunction: cmsServerFunction,
  });
}
