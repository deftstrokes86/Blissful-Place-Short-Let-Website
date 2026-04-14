import type { ReactNode } from "react";

import "./globals.css";

// Root layout is a bare passthrough — no <html><body> here.
// (site)/layout.tsx owns the document shell for public routes.
// (cms)/layout.tsx (via Payload's RootLayout) owns its own document shell.
// Rendering <html><body> here would create a double-document conflict with Payload.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
