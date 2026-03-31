import "@payloadcms/next/css";

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { RootLayout } from "@payloadcms/next/layouts";

import { cmsImportMap } from "@/cms/payload";
import payloadConfig from "@/cms/payload.config";
import { cmsServerFunction } from "./cms/server-function";

interface CmsRootLayoutProps {
  children: ReactNode;
}

export { metadata } from "@payloadcms/next/layouts";

function withHydrationSafeBody(layoutTree: ReactNode): ReactNode {
  if (!isValidElement(layoutTree)) {
    return layoutTree;
  }

  const htmlElement = layoutTree as ReactElement<Record<string, unknown>>;
  const htmlChildren = Children.toArray(htmlElement.props.children);

  const patchedChildren = htmlChildren.map((child) => {
    if (!isValidElement(child) || child.type !== "body") {
      return child;
    }

    const bodyElement = child as ReactElement<Record<string, unknown>>;

    return cloneElement(bodyElement, {
      ...bodyElement.props,
      suppressHydrationWarning: true,
    });
  });

  return cloneElement(
    htmlElement,
    {
      ...htmlElement.props,
      suppressHydrationWarning: true,
    },
    ...patchedChildren
  );
}

export default async function CmsRootLayout({ children }: CmsRootLayoutProps) {
  const payloadRootLayout = await RootLayout({
    children,
    config: Promise.resolve(payloadConfig),
    htmlProps: {
      suppressHydrationWarning: true,
    },
    importMap: cmsImportMap,
    serverFunction: cmsServerFunction,
  });

  return withHydrationSafeBody(payloadRootLayout);
}
