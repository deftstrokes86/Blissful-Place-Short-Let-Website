import { CheckCircle2 } from "@/lib/lucide-react";
import { PageBackLink } from "@/components/common/PageBackLink";

export function BookingPageIntro() {
  return (
    <>
      <section className="container" style={{ paddingTop: "8rem", paddingBottom: "2rem", maxWidth: "1200px" }}>
        <PageBackLink />
        <h1 className="heading-lg serif">Complete Your Booking</h1>
        <p className="text-secondary" style={{ fontSize: "1.05rem" }}>
          Experience a seamless, secure, and personalized reservation process.
        </p>
      </section>

      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-panel)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "2.5rem",
            flexWrap: "wrap",
            padding: "0.9rem 0",
            maxWidth: "1200px",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={15} className="text-primary" /> Verified Real-Time Availability
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={15} className="text-primary" /> Secure Branched Payment Logic
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={15} className="text-primary" /> 24/7 Dedicated Concierge Support
          </span>
        </div>
      </div>
    </>
  );
}
