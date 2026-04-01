import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Blissful Place | Residences",
  description: "Experience the pinnacle of urban luxury living.",
};

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
