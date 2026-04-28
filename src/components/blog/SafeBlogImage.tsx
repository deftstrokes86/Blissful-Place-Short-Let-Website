import React from "react";
import Image from "next/image";

import { resolveRenderableBlogImageUrl } from "@/lib/blog-image";

interface SafeBlogImageProps {
  alt: string;
  fallbackClassName?: string;
  sizes: string;
  src: string | null | undefined;
}

export function SafeBlogImage({
  alt,
  fallbackClassName = "blog-image-fallback",
  sizes,
  src,
}: SafeBlogImageProps) {
  const safeSrc = resolveRenderableBlogImageUrl(src);

  if (!safeSrc) {
    return <span className={fallbackClassName} aria-hidden="true" />;
  }

  return <Image src={safeSrc} alt={alt} fill sizes={sizes} />;
}

