import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

type PublicInfoPageShellProps = {
  children: ReactNode;
};

export function PublicInfoPageShell({ children }: PublicInfoPageShellProps) {
  return (
    <main className="blog-page">
      <SiteHeader />
      {children}
      <SiteFooter />
    </main>
  );
}
