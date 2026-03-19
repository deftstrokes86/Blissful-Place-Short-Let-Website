import Link from "next/link";
import type { CSSProperties } from "react";

import { ArrowLeft } from "@/lib/lucide-react";

interface PageBackLinkProps {
  href?: string;
  label?: string;
  style?: CSSProperties;
}

export function PageBackLink({
  href = "/",
  label = "Back to Homepage",
  style,
}: PageBackLinkProps) {
  return (
    <Link
      href={href}
      className="hover-primary"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        color: "var(--text-secondary)",
        marginBottom: "1.5rem",
        fontWeight: 500,
        ...style,
      }}
    >
      <ArrowLeft size={16} /> {label}
    </Link>
  );
}

