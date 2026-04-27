import "./site.css";

import { StructuredData } from "@/components/site/StructuredData";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.blissfulplaceresidences.com"),
  title: {
    default: "Blissful Place Residences | Premium Short-Let Apartments in Agbado, Lagos",
    template: "%s | Blissful Place Residences",
  },
  description: "Three professionally managed short-let apartments in Agbado, Lagos — minutes from Ikeja, Abule Egba, Meiran & Egbeda. Silent solar power, fiber internet, gated security. Book direct and save.",
};

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${inter.variable}`}>
      <body suppressHydrationWarning className={inter.className}>
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
