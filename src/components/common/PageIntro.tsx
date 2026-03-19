import type { CSSProperties } from "react";

import { PageBackLink } from "@/components/common/PageBackLink";

interface PageIntroProps {
  title: string;
  description: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  wrapperStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  descriptionStyle?: CSSProperties;
}

export function PageIntro({
  title,
  description,
  subtitle,
  backHref,
  backLabel,
  wrapperStyle,
  titleStyle,
  descriptionStyle,
}: PageIntroProps) {
  return (
    <div style={{ marginBottom: "3rem", ...wrapperStyle }}>
      <PageBackLink href={backHref} label={backLabel} />
      {subtitle && (
        <span className="subtitle-tag" style={{ display: "block", margin: "0 0 1rem 0" }}>
          {subtitle}
        </span>
      )}
      <h1 className="heading-lg serif" style={titleStyle}>
        {title}
      </h1>
      <p className="text-secondary" style={{ fontSize: "1.1rem", ...descriptionStyle }}>
        {description}
      </p>
    </div>
  );
}
