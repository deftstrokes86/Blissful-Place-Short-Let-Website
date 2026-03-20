import type { RefObject } from "react";

import { EXTRAS, FLATS } from "@/lib/constants";
import { formatCurrency } from "@/lib/booking-utils";
import { CalendarDays, Users } from "@/lib/lucide-react";
import type { ExtraId, FlatId, StayFormState, StayTouchedState, StayValidation } from "@/types/booking";

interface StayDetailsStepProps {
  stay: StayFormState;
  stayTouched: StayTouchedState;
  stayValidation: StayValidation;
  onSelectFlat: (flatId: FlatId) => void;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  onGuestsChange: (value: number) => void;
  onMarkTouched: (field: keyof StayTouchedState) => void;
  onToggleExtra: (id: ExtraId) => void;
  onOpenCheckInPicker: () => void;
  onOpenCheckOutPicker: () => void;
  checkInInputRef: RefObject<HTMLInputElement | null>;
  checkOutInputRef: RefObject<HTMLInputElement | null>;
  blockedDateSummary: string | null;
  blockedDateSelectionWarning: string | null;
  blockedDateError: string | null;
  isLoadingBlockedDates: boolean;
}

export function StayDetailsStep({
  stay,
  stayTouched,
  stayValidation,
  onSelectFlat,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
  onMarkTouched,
  onToggleExtra,
  onOpenCheckInPicker,
  onOpenCheckOutPicker,
  checkInInputRef,
  checkOutInputRef,
  blockedDateSummary,
  blockedDateSelectionWarning,
  blockedDateError,
  isLoadingBlockedDates,
}: StayDetailsStepProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <div className="booking-section">
        <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="step-circle">1</span> Select Your Residence
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {FLATS.map((flat) => (
            <button
              key={flat.id}
              type="button"
              className={`payment-plan-card ${stay.flatId === flat.id ? "selected" : ""}`}
              style={{ textAlign: "left" }}
              onClick={() => onSelectFlat(flat.id)}
            >
              <span className="radio-ring">{stay.flatId === flat.id && <span className="radio-dot" />}</span>
              <div>
                <div style={{ fontWeight: 700 }}>{flat.name}</div>
                <div
                  style={{
                    marginTop: "0.35rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{flat.blurb}</span>
                  <span style={{ fontWeight: 600, color: "var(--primary)", whiteSpace: "nowrap" }}>
                    {formatCurrency(flat.rate)} / night
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
        {stayTouched.flatId && stayValidation.flatId && <p className="booking-inline-error">{stayValidation.flatId}</p>}
      </div>

      <div className="booking-section">
        <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="step-circle">1</span> Stay Schedule & Guests
        </h2>
        <div className="flex-grid">
          <div className="input-group">
            <label htmlFor="check-in">Check-in Date</label>
            <div className="input-wrapper" onClick={onOpenCheckInPicker}>
              <CalendarDays size={18} className="input-icon" />
              <input
                ref={checkInInputRef}
                id="check-in"
                type="date"
                value={stay.checkIn}
                onChange={(e) => onCheckInChange(e.target.value)}
                onBlur={() => onMarkTouched("checkIn")}
                min={today}
              />
            </div>
            {stayTouched.checkIn && stayValidation.checkIn && <p className="booking-inline-error">{stayValidation.checkIn}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="check-out">Check-out Date</label>
            <div className="input-wrapper" onClick={onOpenCheckOutPicker}>
              <CalendarDays size={18} className="input-icon" />
              <input
                ref={checkOutInputRef}
                id="check-out"
                type="date"
                value={stay.checkOut}
                onChange={(e) => onCheckOutChange(e.target.value)}
                onBlur={() => onMarkTouched("checkOut")}
                min={stay.checkIn || today}
              />
            </div>
            {stayTouched.checkOut && stayValidation.checkOut && <p className="booking-inline-error">{stayValidation.checkOut}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="guests">Number of Guests</label>
            <div className="input-wrapper">
              <Users size={18} className="input-icon" />
              <select
                id="guests"
                value={stay.guests || ""}
                onChange={(e) => onGuestsChange(Number(e.target.value))}
                onBlur={() => onMarkTouched("guests")}
              >
                <option value="">Select guests</option>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} Guest{num > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            {stayTouched.guests && stayValidation.guests && <p className="booking-inline-error">{stayValidation.guests}</p>}
          </div>
        </div>

        {isLoadingBlockedDates && (
          <p className="booking-inline-note booking-inline-note-muted" style={{ marginTop: "1rem" }}>
            Loading unavailable dates for this residence...
          </p>
        )}

        {blockedDateError && (
          <p className="booking-inline-note booking-inline-note-muted" style={{ marginTop: "1rem" }}>
            {blockedDateError}
          </p>
        )}

        {!isLoadingBlockedDates && !blockedDateError && blockedDateSummary && (
          <p className="booking-inline-note booking-inline-note-muted" style={{ marginTop: "1rem" }}>
            {blockedDateSummary}
          </p>
        )}

        {blockedDateSelectionWarning && <p className="booking-inline-error">{blockedDateSelectionWarning}</p>}
      </div>

      <div className="booking-section">
        <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="step-circle">1</span> Optional Enhancements (Flat Fee)
        </h2>
        <div style={{ display: "grid", gap: "0.9rem" }}>
          {EXTRAS.map((extra) => {
            const Icon = extra.icon;
            const selected = stay.extraIds.includes(extra.id);

            return (
              <button
                key={extra.id}
                type="button"
                className={`addon-select-card ${selected ? "selected" : ""}`}
                onClick={() => onToggleExtra(extra.id)}
              >
                <span className="checkbox-ring">{selected && <span className="checkbox-dot" />}</span>
                <Icon size={20} className="text-primary" />
                <div style={{ textAlign: "left" }}>
                  <div className="booking-extra-title" style={{ fontWeight: 700 }}>
                    {extra.title}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{extra.desc}</div>
                  <div style={{ marginTop: "0.3rem", color: "var(--primary)", fontWeight: 600 }}>
                    {formatCurrency(extra.price)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

