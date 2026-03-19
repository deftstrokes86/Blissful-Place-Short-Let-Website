import type {
  GuestFormState,
  GuestTouchedState,
  GuestValidation,
} from "@/types/booking";

interface GuestDetailsStepProps {
  guest: GuestFormState;
  guestTouched: GuestTouchedState;
  guestValidation: GuestValidation;
  onFieldChange: <K extends keyof GuestFormState>(field: K, value: GuestFormState[K]) => void;
  onMarkTouched: (field: keyof GuestTouchedState) => void;
}

export function GuestDetailsStep({
  guest,
  guestTouched,
  guestValidation,
  onFieldChange,
  onMarkTouched,
}: GuestDetailsStepProps) {
  return (
    <div className="booking-section">
      <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span className="step-circle">2</span> Guest Information
      </h2>
      <div className="flex-grid">
        <div className="input-group">
          <label htmlFor="first-name">First Name</label>
          <input
            id="first-name"
            className="standard-input"
            value={guest.firstName}
            onChange={(e) => onFieldChange("firstName", e.target.value)}
            onBlur={() => onMarkTouched("firstName")}
            placeholder="First name"
          />
          {guestTouched.firstName && guestValidation.firstName && (
            <p className="booking-inline-error">{guestValidation.firstName}</p>
          )}
        </div>
        <div className="input-group">
          <label htmlFor="last-name">Last Name</label>
          <input
            id="last-name"
            className="standard-input"
            value={guest.lastName}
            onChange={(e) => onFieldChange("lastName", e.target.value)}
            onBlur={() => onMarkTouched("lastName")}
            placeholder="Last name"
          />
          {guestTouched.lastName && guestValidation.lastName && (
            <p className="booking-inline-error">{guestValidation.lastName}</p>
          )}
        </div>
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            className="standard-input"
            value={guest.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            onBlur={() => onMarkTouched("email")}
            placeholder="you@example.com"
          />
          {guestTouched.email && guestValidation.email && (
            <p className="booking-inline-error">{guestValidation.email}</p>
          )}
        </div>
        <div className="input-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            className="standard-input"
            value={guest.phone}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            onBlur={() => onMarkTouched("phone")}
            placeholder="+234..."
          />
          {guestTouched.phone && guestValidation.phone && (
            <p className="booking-inline-error">{guestValidation.phone}</p>
          )}
        </div>
      </div>
      <div className="input-group" style={{ marginTop: "1.5rem" }}>
        <label htmlFor="special-requests">Special Requests (Optional)</label>
        <textarea
          id="special-requests"
          className="standard-input"
          rows={4}
          value={guest.specialRequests}
          onChange={(e) => onFieldChange("specialRequests", e.target.value)}
          placeholder="Tell us about special occasions or arrival preferences..."
          style={{ resize: "vertical" }}
        />
      </div>
    </div>
  );
}
