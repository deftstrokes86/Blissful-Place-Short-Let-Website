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
  routeSlug: PropertyFlatRouteSlug;
  metaDescription: string;
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

export const DEFAULT_PROPERTY_FLAT_ID: FlatId = "windsor";

export const PROPERTY_FLAT_ROUTE_SLUG_BY_ID = {
  windsor: "windsor-residence",
  kensington: "kensington-lodge",
  mayfair: "mayfair-suite",
} as const satisfies Record<FlatId, string>;

export type PropertyFlatRouteSlug = (typeof PROPERTY_FLAT_ROUTE_SLUG_BY_ID)[FlatId];

export const PROPERTY_FLAT_ID_BY_ROUTE_SLUG = {
  "windsor-residence": "windsor",
  "kensington-lodge": "kensington",
  "mayfair-suite": "mayfair",
} as const satisfies Record<PropertyFlatRouteSlug, FlatId>;

export const PROPERTY_FLAT_IDS = ["windsor", "kensington", "mayfair"] as const satisfies readonly FlatId[];

export const PROPERTY_FLAT_CONTENT: Record<FlatId, PropertyFlatContent> = {
  windsor: {
    routeSlug: PROPERTY_FLAT_ROUTE_SLUG_BY_ID.windsor,
    metaDescription:
      "Explore Windsor Residence, a furnished 3-bedroom short-let apartment at Blissful Place Residences in Agbado, Lagos with equipped kitchen, fiber internet, solar-backed power, and guest support.",
    subtitle: "THE CALM CLASSIC",
    positioningLine:
      "Windsor Residence is a warm, restful space designed for guests who value comfort, quiet, and a smooth stay from check-in to checkout.",
    heroImage: {
      src: "/living-room-downstairs-1.webp",
      alt: "Windsor Residence living room",
    },
    galleryImages: [
      {
        src: "/windsor-suite-collage-1.webp",
        alt: "Windsor Residence interior",
      },
      {
        src: "/windsor-suite-collage-2.webp",
        alt: "Windsor Residence interior",
      },
    ],
    overview: [
      "Windsor Residence is set up for calm day-to-day living. The interiors are warm and understated, with practical comforts that suit both short visits and extended stays.",
      "From reliable solar power to fiber internet and responsive support, every essential is handled so you can focus on rest or work without friction.",
      "The apartment also includes an equipped kitchen with an induction cooker, microwave, blender, and cooking utensils, plus access to an AI-powered washing machine for self-laundry or paid laundry support.",
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
          "Secure gated compound with on-site guards, CCTV coverage, and controlled vehicle access for your peace of mind.",
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
      "Equipped kitchen with induction cooker, microwave, blender, and utensils",
      "AI-powered washing machine access",
      "Scheduled housekeeping",
      "Responsive WhatsApp support",
    ],
  },
  kensington: {
    routeSlug: PROPERTY_FLAT_ROUTE_SLUG_BY_ID.kensington,
    metaDescription:
      "Explore Kensington Lodge, a furnished 3-bedroom short-let apartment at Blissful Place Residences in Agbado, Lagos with comfortable living spaces, equipped kitchen, fiber internet, and gated access.",
    subtitle: "THE FOCUSED RETREAT",
    positioningLine:
      "Kensington Lodge is a clean, orderly space suited for professionals, remote workers, and guests who value structure and quiet.",
    heroImage: {
      src: "/living-room-downstairs-landscape-2.webp",
      alt: "Kensington Lodge living area",
    },
    galleryImages: [
      {
        src: "/kensington-lodge-collage-1.webp",
        alt: "Kensington Lodge interior",
      },
      {
        src: "/kensington-lodge-collage-2.webp",
        alt: "Kensington Lodge interior",
      },
    ],
    overview: [
      "Kensington Lodge is ideal for guests who want a well-organised base with minimal distractions. The layout is practical and the environment is kept quiet.",
      "Fiber internet, solar power, and professional management mean the essentials just work — so your stay runs smoothly whether you're here for two nights or two weeks.",
      "The apartment also includes an equipped kitchen with an induction cooker, microwave, blender, and cooking utensils, plus access to an AI-powered washing machine for self-laundry or paid laundry support.",
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
          "Secure gated compound with on-site guards, CCTV coverage, and controlled vehicle access for your peace of mind.",
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
      "Equipped kitchen with induction cooker, microwave, blender, and utensils",
      "AI-powered washing machine access",
      "Scheduled housekeeping",
      "Responsive WhatsApp support",
    ],
  },
  mayfair: {
    routeSlug: PROPERTY_FLAT_ROUTE_SLUG_BY_ID.mayfair,
    metaDescription:
      "Explore Mayfair Suite, a furnished 3-bedroom short-let apartment at Blissful Place Residences in Agbado, Lagos with calm interiors, equipped kitchen, solar-backed power, and guest support.",
    subtitle: "THE STATEMENT STAY",
    positioningLine:
      "Mayfair Suite brings bold finishing touches to the same trusted layout — for guests who appreciate a space with personality.",
    heroImage: {
      src: "/living-room-upstairs-landscape-1.webp",
      alt: "Mayfair Suite living room",
    },
    galleryImages: [
      {
        src: "/mayfair-suites-collage1.webp",
        alt: "Mayfair Suite interior",
      },
      {
        src: "/mayfair-suite-collage-2.webp",
        alt: "Mayfair Suite interior",
      },
    ],
    overview: [
      "Mayfair Suite has the same reliable infrastructure as every Blissful Place residence, with bolder decor choices that give the space a distinctive character.",
      "It's a strong choice for guests hosting small get-togethers, marking an occasion, or simply preferring a setting with more visual energy.",
      "The apartment also includes an equipped kitchen with an induction cooker, microwave, blender, and cooking utensils, plus access to an AI-powered washing machine for self-laundry or paid laundry support.",
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
          "Secure gated compound with on-site guards, CCTV coverage, and controlled vehicle access for your peace of mind.",
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
      "Equipped kitchen with induction cooker, microwave, blender, and utensils",
      "AI-powered washing machine access",
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

  return resolved ?? DEFAULT_PROPERTY_FLAT_ID;
}

export function resolvePropertyFlatIdFromRouteSlug(value: string | string[] | null | undefined): FlatId | null {
  const token = pickFirstValue(value);

  if (!token) {
    return null;
  }

  return PROPERTY_FLAT_ID_BY_ROUTE_SLUG[token as PropertyFlatRouteSlug] ?? null;
}

export function getPropertyFlatRoute(flatId: FlatId): `/property/${PropertyFlatRouteSlug}` {
  return `/property/${PROPERTY_FLAT_ROUTE_SLUG_BY_ID[flatId]}`;
}

export function resolveLegacyPropertyFlatRoute(value: string | string[] | null | undefined): `/property/${PropertyFlatRouteSlug}` | null {
  const token = pickFirstValue(value);
  const resolved = resolveFlatQueryParam(token);

  return resolved ? getPropertyFlatRoute(resolved) : null;
}
