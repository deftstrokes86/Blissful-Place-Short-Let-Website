import "@payloadcms/next/css";

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import type { Metadata } from "next";

import { metadata as payloadMetadata, RootLayout } from "@payloadcms/next/layouts";

import { cmsImportMap } from "@/cms/payload";
import payloadConfig from "@/cms/payload.config";
import { cmsServerFunction } from "./cms/server-function";

interface CmsRootLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  ...payloadMetadata,
  robots: {
    index: false,
    follow: false,
  },
};

interface HydrationSafeElementProps {
  children?: ReactNode;
  suppressHydrationWarning?: boolean;
}

function withHydrationSafeBody(layoutTree: ReactNode): ReactNode {
  if (!isValidElement(layoutTree)) {
    return layoutTree;
  }

  const htmlElement = layoutTree as ReactElement<HydrationSafeElementProps>;
  const htmlChildren = Children.toArray(htmlElement.props.children);

  const patchedChildren = htmlChildren.map((child) => {
    if (!isValidElement(child) || child.type !== "body") {
      return child;
    }

    const bodyElement = child as ReactElement<HydrationSafeElementProps>;

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
