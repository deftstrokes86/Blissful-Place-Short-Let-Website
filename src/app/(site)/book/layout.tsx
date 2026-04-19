import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Book Your Stay — Short-Let Apartment Near Ikeja, Lagos",
  description: "Book a premium short-let apartment directly in Agbado, Lagos — no Airbnb fees. 24/7 solar power, fiber internet, secure parking. Minutes from Ikeja, Abule Egba & Meiran.",
};

export default function BookLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
