import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Book a Private Tour",
  description: "Schedule a private viewing of our short-let apartments in Agbado, Lagos. See the solar power system, fiber internet setup, and security firsthand.",
};

export default function TourLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
