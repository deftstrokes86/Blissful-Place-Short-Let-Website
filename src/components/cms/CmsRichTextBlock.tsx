import { RichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "lexical";

export interface CmsRichTextBlockData {
  heading?: string | null;
  body: SerializedEditorState;
}

interface CmsRichTextBlockProps {
  block: CmsRichTextBlockData | null | undefined;
  className?: string;
  headingClassName?: string;
  contentClassName?: string;
}

function mergeClassNames(...values: Array<string | undefined>): string {
  return values.filter((value): value is string => Boolean(value && value.trim().length > 0)).join(" ");
}

function asNonEmptyString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function CmsRichTextBlock({
  block,
  className,
  headingClassName,
  contentClassName,
}: CmsRichTextBlockProps) {
  const heading = asNonEmptyString(block?.heading);

  if (!block?.body) {
    if (!heading) {
      return null;
    }

    return (
      <section className={mergeClassNames("cms-richtext-block", className)}>
        <h2 className={mergeClassNames("cms-richtext-heading serif", headingClassName)}>{heading}</h2>
      </section>
    );
  }

  return (
    <section className={mergeClassNames("cms-richtext-block", className)}>
      {heading ? <h2 className={mergeClassNames("cms-richtext-heading serif", headingClassName)}>{heading}</h2> : null}
      <div className={mergeClassNames("cms-richtext-content", contentClassName)}>
        <RichText data={block.body} />
      </div>
    </section>
  );
}
