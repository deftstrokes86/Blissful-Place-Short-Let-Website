import type { ReactNode } from "react";

import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "About Blissful Place Residences",
  description:
    "Learn about Blissful Place Residences, professionally managed short-let apartments in Agbado, Lagos for guests seeking comfort, privacy, and reliable support.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

