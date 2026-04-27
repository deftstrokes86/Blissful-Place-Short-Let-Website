import type { Metadata } from "next";
import type { ReactNode } from "react";

interface StaffLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function StaffLayout({ children }: StaffLayoutProps) {
  // Staff routes share the same provider posture as admin routes: server-side auth guards, no custom React context yet.
  // Add any future client-side provider here before individual staff pages begin consuming it.
  return <>{children}</>;
}
