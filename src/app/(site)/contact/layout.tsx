import type { ReactNode } from "react";

import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "Contact Blissful Place Residences",
  description:
    "Contact Blissful Place Residences for bookings, enquiries, apartment availability, tours, and guest support in Agbado, Lagos.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

