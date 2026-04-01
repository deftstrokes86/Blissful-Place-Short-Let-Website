import type { ReactNode } from "react";
import { Playfair_Display, Inter } from "next/font/google";

import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${inter.variable}`}>
      <body suppressHydrationWarning className={inter.className}>
        {children}
      </body>
    </html>
  );
}
