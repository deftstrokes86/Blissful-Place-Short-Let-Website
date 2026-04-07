import type { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Admin routes currently rely on server-side auth guards and local component state, not React context providers.
  // If a client-side provider becomes necessary later, mount it here so the full admin surface shares one boundary.
  return <>{children}</>;
}
