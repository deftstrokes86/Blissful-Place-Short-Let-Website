import Image from "next/image";

export type BrandLogoVariant = "nav" | "footer";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
}

export function BrandLogo({ variant = "nav" }: BrandLogoProps) {
  return (
    <span className={`brand-logo brand-logo-${variant}`} aria-label="Blissful Place Residences">
      <Image
        src="/blissful_place_logo-.png"
        alt="Blissful Place Residences"
        width={1024}
        height={326}
        className={`brand-logo-image ${variant === "footer" ? "brand-logo-image-footer" : ""}`}
        priority={variant === "nav"}
      />
    </span>
  );
}

