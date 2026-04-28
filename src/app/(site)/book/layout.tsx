import type { ReactNode } from "react";

import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "Book a Short-Let Apartment",
  description:
    "Check availability and book a short-let apartment at Blissful Place Residences in Agbado, Lagos.",
  path: "/book",
});

export default function BookLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

