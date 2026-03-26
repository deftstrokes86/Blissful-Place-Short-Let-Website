"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PageIntro } from "@/components/common/PageIntro";
import { formatCurrency } from "@/lib/booking-utils";
import { buildBookingHref } from "@/lib/booking-flat-preselection";
import { FLATS } from "@/lib/constants";
import { PROPERTY_FLAT_CONTENT } from "@/lib/property-flat-content";
import { SITE_CITY_NAME, SITE_DISTRICT_NAME } from "@/lib/site-config";
import { Bath, BedDouble, Car, Check, CheckCircle2, Shield, Users, Wifi, Zap } from "@/lib/lucide-react";
import type { FlatId } from "@/types/booking";

interface PropertyFlatExperienceProps {
  initialFlatId: FlatId;
}

const STAT_ICON_BY_KEY = {
  users: Users,
  bed: BedDouble,
  bath: Bath,
  car: Car,
} as const;

const FEATURE_ICON_BY_KEY = {
  zap: Zap,
  wifi: Wifi,
  shield: Shield,
} as const;

export function PropertyFlatExperience({ initialFlatId }: PropertyFlatExperienceProps) {
  const router = useRouter();
  const [isSwitchPending, startTransition] = useTransition();
  const [selectedFlatId, setSelectedFlatId] = useState<FlatId>(initialFlatId);
  const [contentAnimationKey, setContentAnimationKey] = useState(0);


  const selectedFlat = useMemo(
    () => FLATS.find((flat) => flat.id === selectedFlatId) ?? FLATS[0],
    [selectedFlatId],
  );

  const selectedContent = PROPERTY_FLAT_CONTENT[selectedFlat.id];

  const availabilityHref = selectedFlat ? `/availability?flat=${selectedFlat.id}` : "/availability";
  const tourHref = selectedFlat ? `/tour?flat=${selectedFlat.id}` : "/tour";
  const bookingHref = selectedFlat ? buildBookingHref(selectedFlat.id) : buildBookingHref();

  function handleFlatSelect(flatId: FlatId): void {
    if (flatId === selectedFlatId) {
      return;
    }

    setSelectedFlatId(flatId);
    setContentAnimationKey((value) => value + 1);

    startTransition(() => {
      router.replace(`/property?flat=${flatId}`, { scroll: false });
    });
  }

  return (
    <main className="container property-page" style={{ paddingTop: "8rem", paddingBottom: "4rem", minHeight: "100vh", maxWidth: "1200px" }}>
      <PageIntro
        subtitle={selectedContent.subtitle}
        title={selectedFlat.name}
        description={`${selectedContent.positioningLine} Located in ${SITE_DISTRICT_NAME}, ${SITE_CITY_NAME}.`}
        descriptionStyle={{ maxWidth: "800px" }}
      />

      <section className="property-flat-selector-wrap" aria-label="Residence selector">
        <p className="property-flat-selector-label">Choose your residence view</p>
        <div className="property-flat-selector" role="tablist" aria-label="Select residence">
          {FLATS.map((flat) => {
            const isActive = flat.id === selectedFlat.id;

            return (
              <button
                key={flat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? "page" : undefined}
                className={`property-flat-pill${isActive ? " is-active" : ""}${isSwitchPending ? " is-pending" : ""}`}
                onClick={() => handleFlatSelect(flat.id)}
              >
                <span className="property-flat-pill-name">{flat.name}</span>
                <span className="property-flat-pill-rate">{formatCurrency(flat.rate)} / night</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="property-grid">
        <div
          key={`${selectedFlat.id}-${contentAnimationKey}`}
          className={`property-content-swap${isSwitchPending ? " is-pending" : ""}`}
          style={{ display: "flex", flexDirection: "column", gap: "3rem" }}
        >
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <Image src={selectedContent.heroImage.src} alt={selectedContent.heroImage.alt} fill style={{ objectFit: "cover" }} />
          </div>

          <div
            key={`${selectedFlat.id}-gallery-${contentAnimationKey}`}
            className={`property-gallery-grid${isSwitchPending ? " is-pending" : ""}`}
          >
            {selectedContent.galleryImages.map((image) => (
              <div key={image.src} className="property-gallery-card">
                <Image src={image.src} alt={image.alt} fill style={{ objectFit: "cover" }} />
              </div>
            ))}
          </div>

          <section>
            <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
              Property Overview
            </h2>
            <div style={{ display: "grid", gap: "1.2rem", marginBottom: "2rem" }}>
              {selectedContent.overview.map((paragraph) => (
                <p key={paragraph} style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
                  {paragraph}
                </p>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.1rem" }}>
              {selectedContent.stats.map((stat) => {
                const Icon = STAT_ICON_BY_KEY[stat.icon];

                return (
                  <div key={stat.label} className="property-stat-chip">
                    <Icon size={20} className="text-primary" />
                    <span>{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
              Operational Comfort Highlights
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
              {selectedContent.featureCards.map((feature) => {
                const Icon = FEATURE_ICON_BY_KEY[feature.icon];

                return (
                  <div key={feature.title} className="property-feature-card">
                    <Icon size={24} className="text-primary" style={{ flexShrink: 0 }} />
                    <div>
                      <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                        {feature.title}
                      </h4>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
              House Rules Summary
            </h2>
            <ul style={{ color: "var(--text-secondary)", lineHeight: 2, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {selectedContent.houseRules.map((rule) => (
                <li key={rule} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Check size={16} className="text-primary" /> {rule}
                </li>
              ))}
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Check size={16} className="text-primary" /> Refundable {formatCurrency(selectedContent.securityDeposit)} security deposit required before check-in.
              </li>
            </ul>
          </section>
        </div>

        <div className={`property-pricing-sticky property-summary-card${isSwitchPending ? " is-pending" : ""}`} style={{ position: "sticky", top: "100px" }}>
          <div className="summary-card" style={{ padding: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "var(--font-serif)" }}>{formatCurrency(selectedFlat.rate)}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                / Night
              </span>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>{selectedContent.pricingNote}</p>

            <Link href={bookingHref} className="btn btn-primary btn-full" style={{ padding: "1.25rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              Check Dates & Secure Booking
            </Link>

            <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1rem" }}>
              <Link href={availabilityHref} className="btn btn-outline-primary btn-full" style={{ padding: "0.9rem", fontSize: "0.9rem" }}>
                Check Availability
              </Link>
              <Link href={tourHref} className="btn btn-outline-white btn-full" style={{ padding: "0.9rem", fontSize: "0.9rem" }}>
                Schedule a Private Tour
              </Link>
            </div>

            <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              No charges until you confirm dates.
            </div>

            <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "2rem", paddingTop: "1.5rem" }}>
              <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
                Included in this rate:
              </h4>
              <ul style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {selectedContent.includedInRate.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={14} className="text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

