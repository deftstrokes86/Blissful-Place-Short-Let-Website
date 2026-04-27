import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  alternates: {
    canonical: "/contact",
  },
  title: "Contact Us — Short-Let Apartments in Agbado, Lagos",
  description: "Get in touch with Blissful Place Residences via WhatsApp, phone, or email. Located in Agbado, Lagos — short drive from Ikeja, Abule Egba, Meiran & Egbeda.",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
