import type { CSSProperties } from "react";
import Link from "next/link";

import { ArrowLeft } from "@/lib/lucide-react";

type PageBackLinkNavigationMode = "client" | "anchor";

interface PageBackLinkProps {
  href?: string;
  label?: string;
  style?: CSSProperties;
  navigationMode?: PageBackLinkNavigationMode;
}

const baseLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  color: "var(--text-secondary)",
  marginBottom: "1.5rem",
  fontWeight: 500,
};

export function PageBackLink({
  href = "/",
  label = "Back to Homepage",
  style,
  navigationMode = "client",
}: PageBackLinkProps) {
  const content = (
    <>
      <ArrowLeft size={16} /> {label}
    </>
  );

  const resolvedStyle: CSSProperties = { ...baseLinkStyle, ...style };

  if (navigationMode === "anchor") {
    return (
      <a href={href} className="hover-primary" style={resolvedStyle}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="hover-primary" style={resolvedStyle}>
      {content}
    </Link>
  );
}
