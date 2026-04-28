import Image from "next/image";

import { cn } from "@/lib/utils";

export type BrandLogoVariant = "nav" | "footer";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
}

export function BrandLogo({ variant = "nav" }: BrandLogoProps) {
  const isFooter = variant === "footer";

  return (
    <span className="inline-flex items-center shrink-0" aria-label="Blissful Place Residences">
      <Image
        src="/blissful_place_logo-.png"
        alt="Blissful Place Residences"
        width={1024}
        height={326}
        className={cn(
          "block h-auto max-w-full object-contain",
          isFooter
            ? "w-[140px] max-[900px]:w-[100px]"
            : "w-[200px] min-w-[200px] max-[900px]:w-[100px] max-[900px]:min-w-[100px]"
        )}
      />
    </span>
  );
}
