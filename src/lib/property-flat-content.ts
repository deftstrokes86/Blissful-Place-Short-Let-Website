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
    subtitle: "THE CALM CLASSIC",
    positioningLine:
      "Windsor Residence is a warm, restful space designed for guests who value comfort, quiet, and a smooth stay from check-in to checkout.",
    heroImage: {
      src: "/living-room-downstairs-1.png",
      alt: "Windsor Residence living room",
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
      "Windsor Residence is set up for calm day-to-day living. The interiors are warm and understated, with practical comforts that suit both short visits and extended stays.",
      "From reliable solar power to fiber internet and responsive support, every essential is handled so you can focus on rest or work without friction.",
    ],
    stats: [
      { icon: "users", label: "Max 6 Guests" },
      { icon: "bed", label: "3 Bedrooms" },
      { icon: "bath", label: "3 Bathrooms" },
      { icon: "car", label: "Secure Parking" },
    ],
    featureCards: [
      {
        icon: "zap",
        title: "Silent 24/7 Solar Power",
        description:
          "Full solar and battery system — no generator noise, no diesel fumes, no interruptions. Power runs silently around the clock.",
      },
      {
        icon: "wifi",
        title: "Fiber Optic Internet",
        description:
          "Dedicated fiber connection for reliable remote work, video calls, and streaming throughout your stay.",
      },
      {
        icon: "shield",
        title: "Gated Security",
        description:
          "Secure gated compound with on-site guards and controlled vehicle access for your peace of mind.",
      },
    ],
    houseRules: [
      "Guest count must stay within the approved maximum of 6.",
      "No parties, loud gatherings, or unauthorized events.",
      "Pets are not permitted inside the residence.",
      "Smoking is not allowed indoors.",
    ],
    securityDeposit: 100000,
    pricingNote:
      "Book direct for transparent pricing, smooth pre-arrival coordination, and responsive WhatsApp support throughout your stay.",
    includedInRate: [
      "Silent 24/7 solar power",
      "Fiber optic internet",
      "Scheduled housekeeping",
      "Responsive WhatsApp support",
    ],
  },
  kensington: {
    subtitle: "THE FOCUSED RETREAT",
    positioningLine:
      "Kensington Lodge is a clean, orderly space suited for professionals, remote workers, and guests who value structure and quiet.",
    heroImage: {
      src: "/living-room-downstairs-landscape-landscape-2.png",
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
      "Kensington Lodge is ideal for guests who want a well-organised base with minimal distractions. The layout is practical and the environment is kept quiet.",
      "Fiber internet, solar power, and professional management mean the essentials just work — so your stay runs smoothly whether you're here for two nights or two weeks.",
    ],
    stats: [
      { icon: "users", label: "Max 6 Guests" },
      { icon: "bed", label: "3 Bedrooms" },
      { icon: "bath", label: "3 Bathrooms" },
      { icon: "car", label: "Secure Parking" },
    ],
    featureCards: [
      {
        icon: "zap",
        title: "Silent 24/7 Solar Power",
        description:
          "Full solar and battery system — no generator noise, no diesel fumes, no interruptions. Power runs silently around the clock.",
      },
      {
        icon: "wifi",
        title: "Fiber Optic Internet",
        description:
          "Dedicated fiber connection for reliable remote work, video calls, and streaming throughout your stay.",
      },
      {
        icon: "shield",
        title: "Gated Security",
        description:
          "Secure gated compound with on-site guards and controlled vehicle access for your peace of mind.",
      },
    ],
    houseRules: [
      "Guest count must stay within the approved maximum of 6.",
      "No parties, loud gatherings, or unauthorized events.",
      "Pets are not permitted inside the residence.",
      "Smoking is not allowed indoors.",
    ],
    securityDeposit: 100000,
    pricingNote:
      "Book direct for transparent pricing, smooth pre-arrival coordination, and responsive WhatsApp support throughout your stay.",
    includedInRate: [
      "Silent 24/7 solar power",
      "Fiber optic internet",
      "Scheduled housekeeping",
      "Responsive WhatsApp support",
    ],
  },
  mayfair: {
    subtitle: "THE STATEMENT STAY",
    positioningLine:
      "Mayfair Suite brings bold finishing touches to the same trusted layout — for guests who appreciate a space with personality.",
    heroImage: {
      src: "/living-room-upstairs-landscape-1.png",
      alt: "Mayfair Suite living room",
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
      "Mayfair Suite has the same reliable infrastructure as every Blissful Place residence, with bolder decor choices that give the space a distinctive character.",
      "It's a strong choice for guests hosting small get-togethers, marking an occasion, or simply preferring a setting with more visual energy.",
    ],
    stats: [
      { icon: "users", label: "Max 6 Guests" },
      { icon: "bed", label: "3 Bedrooms" },
      { icon: "bath", label: "3 Bathrooms" },
      { icon: "car", label: "Secure Parking" },
    ],
    featureCards: [
      {
        icon: "zap",
        title: "Silent 24/7 Solar Power",
        description:
          "Full solar and battery system — no generator noise, no diesel fumes, no interruptions. Power runs silently around the clock.",
      },
      {
        icon: "wifi",
        title: "Fiber Optic Internet",
        description:
          "Dedicated fiber connection for reliable remote work, video calls, and streaming throughout your stay.",
      },
      {
        icon: "shield",
        title: "Gated Security",
        description:
          "Secure gated compound with on-site guards and controlled vehicle access for your peace of mind.",
      },
    ],
    houseRules: [
      "Guest count must stay within the approved maximum of 6.",
      "No parties, loud gatherings, or unauthorized events.",
      "Pets are not permitted inside the residence.",
      "Smoking is not allowed indoors.",
    ],
    securityDeposit: 100000,
    pricingNote:
      "Book direct for transparent pricing, smooth pre-arrival coordination, and responsive WhatsApp support throughout your stay.",
    includedInRate: [
      "Silent 24/7 solar power",
      "Fiber optic internet",
      "Scheduled housekeeping",
      "Responsive WhatsApp support",
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


