import { resolveFlatQueryParam } from "./booking-flat-preselection";
import type { FlatId } from "@/types/booking";

export type PropertyStatIconKey = "users" | "bed" | "bath" | "car";
export type PropertyFeatureIconKey = "zap" | "wifi" | "shield";

export interface PropertyImageItem {
  src: string;
  alt: string;
}

export interface PropertyStatItem {
  icon: PropertyStatIconKey;
  label: string;
}

export interface PropertyFeatureItem {
  icon: PropertyFeatureIconKey;
  title: string;
  description: string;
}

export interface PropertyFlatContent {
  subtitle: string;
  positioningLine: string;
  heroImage: PropertyImageItem;
  galleryImages: PropertyImageItem[];
  overview: string[];
  stats: PropertyStatItem[];
  featureCards: PropertyFeatureItem[];
  houseRules: string[];
  securityDeposit: number;
  pricingNote: string;
  includedInRate: string[];
}

export const PROPERTY_FLAT_CONTENT: Record<FlatId, PropertyFlatContent> = {
  windsor: {
    subtitle: "CLASSIC PRIVATE RESIDENCE",
    positioningLine:
      "Windsor Residence offers refined comfort for focused business trips and quiet extended stays.",
    heroImage: {
      src: "/windsor.png",
      alt: "Windsor Residence interior view",
    },
    galleryImages: [
      {
        src: "/bedroom.png",
        alt: "Windsor bedroom setting",
      },
      {
        src: "/pool.png",
        alt: "Windsor leisure amenity",
      },
    ],
    overview: [
      "Windsor Residence is designed for calm day-to-day living, with practical comforts that suit both short and extended stays.",
      "From arrival to checkout, the space is managed for privacy, comfort, and consistent guest support.",
    ],
    stats: [
      { icon: "users", label: "Max 4 Guests" },
      { icon: "bed", label: "2 Bedrooms" },
      { icon: "bath", label: "2 Bathrooms" },
      { icon: "car", label: "1 Secure Parking Spot" },
    ],
    featureCards: [
      {
        icon: "zap",
        title: "Reliable Backup Power",
        description:
          "Backup power support helps keep lighting, cooling, and essentials running more consistently.",
      },
      {
        icon: "wifi",
        title: "Reliable High-Speed Internet",
        description:
          "Reliable high-speed internet supports work calls, streaming, and day-to-day online use.",
      },
      {
        icon: "shield",
        title: "Secure Access & Estate Support",
        description:
          "Controlled access and estate security procedures support a safe and private stay environment.",
      },
    ],
    houseRules: [
      "Guest count must remain within the approved maximum occupancy.",
      "No parties, loud gatherings, or unauthorized commercial shoots.",
      "Pets are not allowed inside the residence.",
    ],
    securityDeposit: 100000,
    pricingNote:
      "Direct booking includes clear pricing, smooth pre-arrival guidance, and responsive guest support.",
    includedInRate: [
      "Responsive WhatsApp support",
      "Reliable high-speed internet",
      "Scheduled premium housekeeping",
    ],
  },
  kensington: {
    subtitle: "QUIET EXECUTIVE LODGE",
    positioningLine:
      "Kensington Lodge balances privacy and polished comfort for professionals who value order and quiet.",
    heroImage: {
      src: "/kensington.png",
      alt: "Kensington Lodge living area",
    },
    galleryImages: [
      {
        src: "/hero-opulence.png",
        alt: "Kensington premium design detail",
      },
      {
        src: "/bedroom.png",
        alt: "Kensington bedroom comfort",
      },
    ],
    overview: [
      "Kensington Lodge is ideal for guests who want a polished, low-noise base with practical city access.",
      "Every essential touchpoint is set up to reduce friction, from power continuity to dependable internet and support.",
    ],
    stats: [
      { icon: "users", label: "Max 5 Guests" },
      { icon: "bed", label: "2 Bedrooms + Lounge" },
      { icon: "bath", label: "2.5 Bathrooms" },
      { icon: "car", label: "2 Secure Parking Spots" },
    ],
    featureCards: [
      {
        icon: "zap",
        title: "Dependable Backup Power",
        description:
          "Backup power continuity is managed to protect comfort, rest, and work hours.",
      },
      {
        icon: "wifi",
        title: "Work & Entertainment Connectivity",
        description:
          "Strong high-speed internet connectivity supports conference calls, browsing, and entertainment.",
      },
      {
        icon: "shield",
        title: "Professional Security Support",
        description:
          "Estate and residence access standards are maintained to support safe, private occupancy.",
      },
    ],
    houseRules: [
      "Only registered guests are permitted for overnight occupancy.",
      "No events, parties, or business gatherings without approval.",
      "Smoking is not permitted indoors.",
    ],
    securityDeposit: 120000,
    pricingNote:
      "Book direct for transparent pricing, smooth arrival preparation, and responsive support.",
    includedInRate: [
      "Dedicated concierge support",
      "Reliable high-speed internet",
      "Scheduled premium cleaning",
    ],
  },
  mayfair: {
    subtitle: "THE SIGNATURE PENTHOUSE",
    positioningLine:
      "Mayfair Suite is our most spacious residence for high-comfort private stays and executive hosting.",
    heroImage: {
      src: "/mayfair.png",
      alt: "Mayfair Suite penthouse interior",
    },
    galleryImages: [
      {
        src: "/hero.png",
        alt: "Mayfair suite premium lounge view",
      },
      {
        src: "/pool.png",
        alt: "Mayfair leisure setting",
      },
    ],
    overview: [
      "Mayfair Suite combines elevated design with practical hospitality systems for a polished guest experience.",
      "It is maintained for guests who value comfort, privacy, and dependable service throughout their stay.",
    ],
    stats: [
      { icon: "users", label: "Max 6 Guests" },
      { icon: "bed", label: "3 King Bedrooms" },
      { icon: "bath", label: "3.5 Bathrooms" },
      { icon: "car", label: "2 Secure Parking Spots" },
    ],
    featureCards: [
      {
        icon: "zap",
        title: "Reliable Power Continuity",
        description:
          "Backup power transitions are managed to keep essential systems running with minimal disruption.",
      },
      {
        icon: "wifi",
        title: "Reliable High-Speed Internet",
        description:
          "Strong internet connectivity supports work, communication, and entertainment throughout the stay.",
      },
      {
        icon: "shield",
        title: "Trusted Security Standards",
        description:
          "24/7 estate coverage and controlled access help preserve privacy and guest confidence.",
      },
    ],
    houseRules: [
      "Max capacity is strictly enforced to preserve residence quality.",
      "No parties or unauthorized commercial shoots/events.",
      "Pets are not allowed on the premises.",
    ],
    securityDeposit: 150000,
    pricingNote:
      "Direct booking offers clear value, transparent pricing, and support before arrival and throughout your stay.",
    includedInRate: [
      "Dedicated WhatsApp concierge support",
      "Reliable high-speed internet",
      "Premium housekeeping",
    ],
  },
};

function pickFirstValue(value: string | string[] | null | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function resolvePropertyFlatId(value: string | string[] | null | undefined): FlatId {
  const token = pickFirstValue(value);
  const resolved = resolveFlatQueryParam(token);

  return resolved ?? "mayfair";
}


