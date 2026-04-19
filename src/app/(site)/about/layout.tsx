import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About Blissful Place Residences",
  description: "Learn about our professionally managed short-let apartments in Agbado, Lagos. Full solar power, fiber internet, gated security, and direct booking. Minutes from Ikeja, Abule Egba & Meiran.",
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
