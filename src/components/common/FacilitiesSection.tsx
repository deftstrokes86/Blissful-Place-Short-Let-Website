import {
  BedDouble,
  Coffee,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
  Tv,
  type LucideIcon,
  Wifi,
  Zap,
} from "@/lib/lucide-react";

type FacilityItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type FacilitiesSectionProps = {
  className?: string;
  headingId?: string;
  revealDelay?: number;
};

const facilityItems: FacilityItem[] = [
  {
    title: "PS4 Gaming Console",
    description:
      "Enjoy a PS4 preloaded with titles like FC25, God of War, Mortal Kombat, and eFootball 2026.",
    icon: Star,
  },
  {
    title: "Premium Streaming",
    description:
      "Relax with already subscribed Netflix, Prime Video, and YouTube Premium on your stay.",
    icon: Tv,
  },
  {
    title: "Smart TV Entertainment",
    description:
      "Each apartment is set up for relaxed viewing and entertainment.",
    icon: Tv,
  },
  {
    title: "High-Speed Internet",
    description:
      "Reliable fiber internet keeps you connected for work, streaming, and everyday browsing.",
    icon: Wifi,
  },
  {
    title: "Solar-Backed Power",
    description:
      "Stable power support helps keep your stay comfortable and uninterrupted.",
    icon: Zap,
  },
  {
    title: "Equipped Kitchen",
    description:
      "Cook with ease using the induction cooker, microwave, blender, and essential cooking utensils.",
    icon: Coffee,
  },
  {
    title: "Laundry Access",
    description:
      "Use the AI-powered washing machine for self-laundry, with optional laundry support available for a fee.",
    icon: Sparkles,
  },
  {
    title: "Security & Peace of Mind",
    description:
      "Gated compound, on-site security, CCTV coverage in external/common areas, and controlled vehicle access.",
    icon: Shield,
  },
  {
    title: "Furnished 3-Bedroom Comfort",
    description:
      "Spacious furnished apartment living designed for short stays, family visits, and group comfort.",
    icon: BedDouble,
  },
  {
    title: "Air Conditioning in All Rooms",
    description:
      "Every room is air-conditioned, giving guests a cooler, more comfortable stay.",
    icon: Zap,
  },
  {
    title: "Scheduled Housekeeping",
    description:
      "Enjoy a cleaner, easier stay with scheduled housekeeping support during your booking.",
    icon: Sparkles,
  },
  {
    title: "Guest Support",
    description:
      "Get direct support before and during your stay whenever you need assistance.",
    icon: MessageSquare,
  },
];

export function FacilitiesSection({
  className = "section container facilities-section",
  headingId = "facilities-heading",
  revealDelay,
}: FacilitiesSectionProps) {
  return (
    <section
      className={className}
      aria-labelledby={headingId}
      data-reveal={revealDelay === undefined ? undefined : ""}
      data-reveal-delay={
        revealDelay === undefined ? undefined : String(revealDelay)
      }
    >
      <div className="facilities-heading text-center">
        <span className="subtitle-tag">FACILITIES</span>
        <h2 id={headingId} className="heading-lg serif">
          Facilities That Make Your Stay Better
        </h2>
        <p className="hero-desc">
          From entertainment and streaming to kitchen convenience, power,
          security, and laundry support, every stay is designed for comfort and
          ease.
        </p>
      </div>

      <div className="facilities-grid">
        {facilityItems.map(({ title, description, icon: Icon }) => (
          <article key={title} className="facility-card">
            <div className="facility-icon-wrapper">
              <Icon size={22} />
            </div>
            <div>
              <h3 className="serif">{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
