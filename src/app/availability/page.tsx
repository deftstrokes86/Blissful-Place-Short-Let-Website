"use client";

import Link from "next/link";
import { useState } from "react";

import { PageIntro } from "@/components/common/PageIntro";
import { buildMockAvailabilityMonth } from "@/lib/availability-calendar";

const MOCK_DATES = buildMockAvailabilityMonth({
  daysInMonth: 31,
  monthStartWeekdayOffset: 1,
});

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function Availability() {
  const [selectedDates, setSelectedDates] = useState<number[]>([]);

  const toggleDate = (day: number, available: boolean) => {
    if (!available) return;

    if (selectedDates.includes(day)) {
      setSelectedDates(selectedDates.filter((selectedDay) => selectedDay !== day));
      return;
    }

    setSelectedDates([...selectedDates, day]);
  };

  return (
    <main className="container" style={{ paddingTop: "6rem", minHeight: "100vh" }}>
      <PageIntro
        title="Live Availability"
        description="Review your preferred dates and nightly rates before you continue to booking."
        backLabel="Back to Home"
        wrapperStyle={{ marginBottom: "3rem" }}
        titleStyle={{ marginTop: "1rem" }}
      />

      <div style={{ background: "var(--bg-panel)", padding: "2rem", borderRadius: "var(--radius-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 className="heading-sm">October 2026</h2>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "transparent",
                  border: "1px solid var(--border-subtle)",
                }}
              />
              Available
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "var(--primary)",
                  opacity: "0.2",
                }}
              />
              Booked
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "var(--primary)",
                }}
              />
              Selected
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "1rem",
            textAlign: "center",
          }}
        >
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {day}
            </div>
          ))}

          <div />
          <div />
          <div />
          <div />

          {MOCK_DATES.map(({ day, available, priceLabel }) => {
            const isSelected = selectedDates.includes(day);
            return (
              <button
                key={day}
                onClick={() => toggleDate(day, available)}
                disabled={!available}
                style={{
                  aspectRatio: "1",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-subtle)"}`,
                  background: isSelected
                    ? "var(--primary)"
                    : available
                      ? "transparent"
                      : "rgba(238, 29, 82, 0.05)",
                  color: isSelected ? "#fff" : available ? "var(--text-primary)" : "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                  opacity: available ? 1 : 0.5,
                  cursor: available ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {!available && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      left: "0",
                      right: "0",
                      background:
                        "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(238, 29, 82, 0.1) 10px, rgba(238, 29, 82, 0.1) 20px)",
                    }}
                  />
                )}

                <span style={{ fontSize: "1.25rem", fontWeight: "bold", position: "relative", zIndex: 1 }}>{day}</span>
                {available && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: isSelected ? "rgba(255,255,255,0.8)" : "var(--text-secondary)",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {priceLabel}
                  </span>
                )}
                {!available && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--primary)",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    Booked
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "2.5rem",
            paddingTop: "2rem",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 className="heading-sm serif">Selected Dates</h3>
            <p className="text-secondary">
              {selectedDates.length > 0 ? `${selectedDates.length} nights selected` : "None selected"}
            </p>
          </div>

          <div style={{ display: "grid", gap: "0.65rem", justifyItems: "end" }}>
            <Link
              href="/book"
              className="btn btn-primary"
              style={{ opacity: selectedDates.length === 0 ? 0.5 : 1, pointerEvents: selectedDates.length === 0 ? "none" : "auto" }}
            >
              Continue to Booking
            </Link>
            <Link href="/tour" className="booking-support-link" style={{ fontSize: "0.85rem" }}>
              Schedule a Private Tour
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
