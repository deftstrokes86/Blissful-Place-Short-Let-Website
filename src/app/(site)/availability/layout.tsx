import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Check Availability",
  description: "See real-time availability for Blissful Place Residences in Agbado, Lagos. Three identical apartments, same premium standard, book directly.",
};

export default function AvailabilityLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
