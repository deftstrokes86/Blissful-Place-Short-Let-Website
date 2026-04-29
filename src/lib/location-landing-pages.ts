import { getPropertyFlatRoute } from "@/lib/property-flat-content";

export type LocationLandingPageKey = "ikeja" | "abuleEgba" | "agbado" | "lagosAirport";

export type LocationLandingPageLink = {
  label: string;
  href: string;
};

export type LocationLandingPageSection = {
  title: string;
  body: string[];
};

export type LocationLandingPageApartmentLink = {
  name: string;
  href: string;
  description: string;
};

export type LocationLandingPageFaq = {
  question: string;
  answer: string;
};

export type LocationLandingPageContent = {
  slug: string;
  path: string;
  title: string;
  eyebrow: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  primaryCta: LocationLandingPageLink;
  secondaryCta: LocationLandingPageLink;
  sections: LocationLandingPageSection[];
  apartmentIntro: string;
  apartmentLinks: LocationLandingPageApartmentLink[];
  guideLinks: LocationLandingPageLink[];
  faqs: LocationLandingPageFaq[];
};

const apartmentLinks: LocationLandingPageApartmentLink[] = [
  {
    name: "Windsor Residence",
    href: getPropertyFlatRoute("windsor"),
    description: "A calm furnished 3-bedroom flat for guests who value restful interiors and a smooth stay.",
  },
  {
    name: "Kensington Lodge",
    href: getPropertyFlatRoute("kensington"),
    description: "A practical 3-bedroom apartment for work trips, family stays, and longer Lagos mainland visits.",
  },
  {
    name: "Mayfair Suite",
    href: getPropertyFlatRoute("mayfair"),
    description: "A composed 3-bedroom suite with comfortable living space, equipped kitchen, and guest support.",
  },
];

export const locationLandingPages = {
  ikeja: {
    slug: "short-let-apartment-near-ikeja",
    path: "/short-let-apartment-near-ikeja",
    title: "Short-Let Apartment Near Ikeja",
    eyebrow: "Ikeja-linked stays",
    intro:
      "A furnished Lagos mainland stay for guests who need access to Ikeja without choosing a hotel room or claiming to stay inside Ikeja. Blissful Place Residences is based in Agbado, Lagos and supports guests with prepared 3-bedroom flats, direct booking help, and practical stay guidance.",
    metaTitle: "Short-Let Apartment Near Ikeja",
    metaDescription:
      "Book a furnished short-let apartment near Ikeja with equipped kitchen, fiber internet, solar-backed power, gated access, and guest support from Blissful Place Residences.",
    primaryCta: { label: "Check availability", href: "/book" },
    secondaryCta: { label: "View apartments", href: "/property" },
    sections: [
      {
        title: "A calm short-let option for guests who need Ikeja access",
        body: [
          "Many guests searching around Ikeja want practical access, more space, and a quieter place to settle after a busy day. Blissful Place Residences gives that kind of guest a professionally managed furnished apartment base in Agbado, Lagos.",
          "This page is for business travellers, visiting professionals, families, and small groups who want a self-contained apartment experience rather than a single hotel room. It is useful when your movement is tied to Ikeja, Alausa, Ogba, or wider mainland plans, while your stay itself remains in a calmer residential setting.",
        ],
      },
      {
        title: "Why guests choose Blissful Place Residences for Ikeja-linked stays",
        body: [
          "Each flat is a furnished 3-bedroom apartment designed for guests who need room to rest, work, cook, and reset. The stay includes fiber internet, solar-backed power, gated access, CCTV coverage in external and common areas, controlled vehicle access, and guest support.",
          "The equipped kitchen includes an induction cooker, microwave, blender, and cooking utensils, so guests can plan simple meals instead of depending on every meal outside. Guests also have access to an AI-powered washing machine, with optional paid laundry support subject to availability and confirmation.",
        ],
      },
      {
        title: "Better suited for guests who want more room than a hotel room",
        body: [
          "A hotel can work for a quick one-night stop, but a furnished apartment is often easier for longer stays, family visits, work trips, or guests who want privacy and living space. Blissful Place Residences keeps the experience structured with clear check-in, checkout, support, and house guidance.",
          "Standard check-in is from 1:00 PM WAT and checkout is by 12:00 PM noon WAT. Early check-in depends on apartment readiness, and late checkout depends on availability with no immediate incoming booking.",
        ],
      },
      {
        title: "Before you book",
        body: [
          "Review the apartment options, confirm your dates, and contact the reservations team if you need help deciding which flat fits your group. Booking payments are non-refundable once confirmed, and any caution deposit is handled separately from the booking payment.",
          "If your plans involve meetings, arrival coordination, or a multi-day family stay, share those details before booking so the team can guide you clearly without promising unverified travel times.",
        ],
      },
    ],
    apartmentIntro:
      "Choose from three furnished 3-bedroom flats. Each can host up to 6 guests unless management approves otherwise.",
    apartmentLinks,
    guideLinks: [
      { label: "Read the guest guide", href: "/guide" },
      { label: "Contact reservations", href: "/contact" },
    ],
    faqs: [
      {
        question: "Is Blissful Place Residences located inside Ikeja?",
        answer:
          "No. Blissful Place Residences is located in Agbado, Lagos. It is suitable for guests who need access toward Ikeja and nearby mainland areas, but the property is not inside Ikeja.",
      },
      {
        question: "Is this suitable for business travellers using Ikeja?",
        answer:
          "Yes, the apartments can suit business travellers who want more room than a hotel room, fiber internet, solar-backed power, and a calmer furnished apartment base on Lagos mainland.",
      },
      {
        question: "Can I cook and do laundry during my stay?",
        answer:
          "Yes. Each flat has an equipped kitchen with induction cooker, microwave, blender, and cooking utensils. Guests also have access to an AI-powered washing machine, with optional paid laundry support subject to availability and confirmation.",
      },
      {
        question: "How do I check availability?",
        answer:
          "Use the booking page to check availability or contact the reservations team before booking if you need help choosing a flat or planning your arrival.",
      },
    ],
  },
  abuleEgba: {
    slug: "short-let-near-abule-egba",
    path: "/short-let-near-abule-egba",
    title: "Short-Let Near Abule Egba",
    eyebrow: "Mainland residential access",
    intro:
      "A furnished short-let option for guests moving around Abule Egba, Agbado, and nearby Lagos mainland areas. Blissful Place Residences offers professionally managed 3-bedroom flats in Agbado with practical comforts for short stays, family visits, and temporary accommodation.",
    metaTitle: "Short-Let Near Abule Egba",
    metaDescription:
      "Stay in a furnished short-let apartment near Abule Egba with comfortable bedrooms, equipped kitchen, fiber internet, solar-backed power, and secure gated access.",
    primaryCta: { label: "Check availability", href: "/book" },
    secondaryCta: { label: "Contact reservations", href: "/contact" },
    sections: [
      {
        title: "A furnished short-let near Abule Egba",
        body: [
          "Guests searching for a short-let near Abule Egba often need a place that feels residential, practical, and easy to manage. Blissful Place Residences is based in Agbado, Lagos and serves guests who want a furnished apartment stay around this part of the mainland.",
          "The aim is not to imitate a hotel. The apartments are set up for guests who want bedrooms, a living area, kitchen convenience, laundry access, and direct support before and during the stay.",
        ],
      },
      {
        title: "Designed for practical Lagos mainland stays",
        body: [
          "The property works well for family visits, short work trips, temporary accommodation, and guests who need a calm place to stay while moving around Abule Egba and nearby mainland areas.",
          "Each flat has fiber internet, solar-backed power, an equipped kitchen, AI-powered washing machine access, gated access, CCTV coverage in external and common areas, on-site security, and controlled vehicle access.",
        ],
      },
      {
        title: "What makes the apartments useful for longer stays",
        body: [
          "A longer stay becomes easier when guests can cook, wash clothing, work online, and get support without starting every day from scratch. The apartments include an induction cooker, microwave, blender, cooking utensils, and practical living areas.",
          "Guest support is available for booking questions, arrival coordination, and stay-related guidance. Optional paid laundry support may be available, but it should be confirmed before relying on it.",
        ],
      },
      {
        title: "Guest guidance",
        body: [
          "Standard check-in is from 1:00 PM WAT and checkout is by 12:00 PM noon WAT. Early check-in is subject to apartment readiness, and late checkout is subject to no immediate incoming booking.",
          "Booking payments are non-refundable once confirmed. A caution deposit may be required before check-in and is handled separately from the booking payment.",
        ],
      },
    ],
    apartmentIntro:
      "Compare the three furnished flats before you choose. Each flat can host up to 6 guests unless management approves otherwise.",
    apartmentLinks,
    guideLinks: [
      { label: "View all apartments", href: "/property" },
      { label: "Read the guest guide", href: "/guide" },
    ],
    faqs: [
      {
        question: "Is Blissful Place Residences a hotel?",
        answer:
          "No. Blissful Place Residences provides professionally managed furnished short-let apartments in Agbado, Lagos. Guests book a furnished flat rather than a hotel room.",
      },
      {
        question: "Is the stay convenient for Abule Egba movement?",
        answer:
          "The property is useful for guests moving around Abule Egba, Agbado, and nearby mainland areas. Exact journey time depends on Lagos traffic and your specific destination.",
      },
      {
        question: "Can families stay in the apartments?",
        answer:
          "Yes. Each furnished 3-bedroom flat is suitable for approved family stays and can host up to 6 guests unless management approves otherwise.",
      },
      {
        question: "What happens to the caution deposit?",
        answer:
          "A caution deposit is separate from the booking payment. It may be applied toward damages, missing items, excessive cleaning, rule violations, unpaid charges, or late checkout charges.",
      },
    ],
  },
  agbado: {
    slug: "short-let-in-agbado-lagos",
    path: "/short-let-in-agbado-lagos",
    title: "Short-Let in Agbado, Lagos",
    eyebrow: "Our true local base",
    intro:
      "Book a furnished short-let apartment in Agbado, Lagos at Blissful Place Residences. The property is located at 16 Tebun Fagbemi Street, Agbado, Lagos, Nigeria and offers three professionally managed 3-bedroom flats for guests who want a prepared apartment rather than a hotel room.",
    metaTitle: "Short-Let in Agbado, Lagos",
    metaDescription:
      "Book a furnished short-let apartment in Agbado, Lagos at Blissful Place Residences with equipped kitchens, fiber internet, solar-backed power, and guest support.",
    primaryCta: { label: "Book your stay", href: "/book" },
    secondaryCta: { label: "View apartments", href: "/property" },
    sections: [
      {
        title: "Short-let apartments in Agbado, Lagos",
        body: [
          "Agbado is the confirmed location of Blissful Place Residences. Guests who want a furnished apartment in this area can book directly with a team that manages the flats, arrival process, house guidance, and stay support.",
          "The property is designed for guests who want a comfortable residential stay with clear expectations: furnished bedrooms, living space, kitchen convenience, fiber internet, solar-backed power, and managed access.",
        ],
      },
      {
        title: "Stay close to home, work, family, and mainland movement",
        body: [
          "This page is useful for guests visiting family, attending work around the mainland, relocating temporarily, or needing a clean apartment base in Agbado. It is also helpful for guests comparing a furnished apartment with a hotel room.",
          "Because the property is in Agbado, this page can speak directly to the local stay experience without pretending the apartments are in another area.",
        ],
      },
      {
        title: "What each flat includes",
        body: [
          "Each flat is a furnished 3-bedroom apartment with an equipped kitchen, induction cooker, microwave, blender, cooking utensils, fiber internet, solar-backed power, AI-powered washing machine access, gated access, on-site security, CCTV coverage in external and common areas, controlled vehicle access, and guest support.",
          "Optional paid laundry support may be available subject to availability and confirmation. Guests should confirm any add-on before arrival.",
        ],
      },
      {
        title: "How booking works",
        body: [
          "Start by reviewing the apartments, then use the booking page to check availability for your dates. If you need help choosing a flat, contact the reservations team before payment.",
          "Booking payments are non-refundable once confirmed. Standard check-in is from 1:00 PM WAT and checkout is by 12:00 PM noon WAT.",
        ],
      },
    ],
    apartmentIntro:
      "Blissful Place Residences has three furnished flats in Agbado. Each apartment is prepared for practical short-let stays.",
    apartmentLinks,
    guideLinks: [
      { label: "Read the guest guide", href: "/guide" },
      { label: "Contact reservations", href: "/contact" },
    ],
    faqs: [
      {
        question: "Where is Blissful Place Residences located?",
        answer:
          "Blissful Place Residences is located at 16 Tebun Fagbemi Street, Agbado, Lagos, Nigeria.",
      },
      {
        question: "How many flats are available?",
        answer:
          "There are three furnished 3-bedroom flats: Windsor Residence, Kensington Lodge, and Mayfair Suite. Each can host up to 6 guests unless management approves otherwise.",
      },
      {
        question: "What time is check-in and checkout?",
        answer:
          "Standard check-in is from 1:00 PM WAT and checkout is by 12:00 PM noon WAT. Early check-in is subject to apartment readiness, and late checkout is subject to no immediate incoming booking.",
      },
      {
        question: "Are booking payments refundable?",
        answer:
          "Booking payments are non-refundable once confirmed. A caution deposit may be required before check-in and is handled separately from the booking payment.",
      },
    ],
  },
  lagosAirport: {
    slug: "short-let-near-lagos-airport",
    path: "/short-let-near-lagos-airport",
    title: "Short-Let Near Lagos Airport",
    eyebrow: "Mainland stay planning",
    intro:
      "A furnished Lagos mainland apartment stay for travellers planning movement toward Lagos Airport. Blissful Place Residences is in Agbado, Lagos, not inside the airport area, and is best considered by guests who want more room, kitchen access, laundry convenience, and direct support while planning airport-linked movement.",
    metaTitle: "Short-Let Near Lagos Airport",
    metaDescription:
      "Plan a comfortable Lagos mainland stay with furnished short-let apartments offering equipped kitchens, fiber internet, solar-backed power, and guest support.",
    primaryCta: { label: "Check availability", href: "/book" },
    secondaryCta: { label: "Ask before booking", href: "/contact" },
    sections: [
      {
        title: "A furnished mainland stay for guests planning Lagos Airport movement",
        body: [
          "Some guests flying into or out of Lagos want a furnished apartment rather than a hotel room. Blissful Place Residences can suit travellers who need a mainland base and are comfortable planning their airport movement around Lagos traffic.",
          "The property is located in Agbado, Lagos. It should not be treated as an airport property, and no exact travel time is claimed here because road conditions and timing can vary.",
        ],
      },
      {
        title: "Useful for arrivals, departures, and short Lagos stopovers",
        body: [
          "The apartments can work for families, small groups, visiting professionals, and guests who need more room than a single room during a short Lagos stay. Each flat gives guests bedrooms, living space, an equipped kitchen, laundry access, fiber internet, and solar-backed power.",
          "For arrival planning, contact reservations before booking if your flight time, luggage, guest count, or expected arrival window affects your decision.",
        ],
      },
      {
        title: "Why choose an apartment instead of a hotel room",
        body: [
          "A furnished apartment gives guests space to settle, prepare simple meals, wash clothing, work online, and rest privately. This can be useful when a trip includes family coordination, errands, meetings, or a stopover that needs more flexibility than a hotel room.",
          "Blissful Place Residences also provides gated access, controlled vehicle access, on-site security, CCTV coverage in external and common areas, and guest support.",
        ],
      },
      {
        title: "Plan your arrival",
        body: [
          "Share your expected arrival time with the reservations team before check-in. Standard check-in is from 1:00 PM WAT, and early check-in depends on apartment readiness.",
          "Checkout is by 12:00 PM noon WAT. Late checkout is only available when there is no immediate incoming booking, so guests with later departures should discuss options early.",
        ],
      },
    ],
    apartmentIntro:
      "Choose the flat that best suits your group size and arrival plan. Each flat can host up to 6 guests unless management approves otherwise.",
    apartmentLinks,
    guideLinks: [
      { label: "View all apartments", href: "/property" },
      { label: "Read the guest guide", href: "/guide" },
    ],
    faqs: [
      {
        question: "Is Blissful Place Residences at Lagos Airport?",
        answer:
          "No. Blissful Place Residences is located in Agbado, Lagos. It may suit guests planning mainland movement toward Lagos Airport, but it is not inside the airport area.",
      },
      {
        question: "Do you provide exact airport travel times?",
        answer:
          "No exact airport travel time is claimed because Lagos traffic, route choice, and departure time can change the journey. Contact reservations for practical arrival guidance before booking.",
      },
      {
        question: "Can I arrive before the standard check-in time?",
        answer:
          "Standard check-in is from 1:00 PM WAT. Early check-in is subject to apartment readiness and should be confirmed with the reservations team before arrival.",
      },
      {
        question: "Is late checkout available for later departures?",
        answer:
          "Late checkout is subject to availability and no immediate incoming booking. Where approved, free late checkout is limited to 2 extra hours.",
      },
    ],
  },
} as const satisfies Record<LocationLandingPageKey, LocationLandingPageContent>;

export const LOCATION_LANDING_PAGES = Object.values(locationLandingPages);
