import { RichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "lexical";

export interface CmsRichTextBlockData {
  heading?: string | null;
  body: SerializedEditorState;
}

interface CmsRichTextBlockProps {
  block: CmsRichTextBlockData;
  className?: string;
  headingClassName?: string;
  contentClassName?: string;
}

function mergeClassNames(...values: Array<string | undefined>): string {
  return values.filter((value): value is string => Boolean(value && value.trim().length > 0)).join(" ");
}

export function CmsRichTextBlock({
  block,
  className,
  headingClassName,
  contentClassName,
}: CmsRichTextBlockProps) {
  return (
    <section className={mergeClassNames("cms-richtext-block", className)}>
      {block.heading ? <h2 className={mergeClassNames("cms-richtext-heading serif", headingClassName)}>{block.heading}</h2> : null}
      <div className={mergeClassNames("cms-richtext-content", contentClassName)}>
        <RichText data={block.body} />
      </div>
    </section>
  );
}
