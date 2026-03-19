interface BookingInlineNoticesProps {
  flowNotice: string | null;
  branchResetNotice: string | null;
  availabilityNote: string | null;
}

export function BookingInlineNotices({
  flowNotice,
  branchResetNotice,
  availabilityNote,
}: BookingInlineNoticesProps) {
  return (
    <>
      {flowNotice && (
        <div className="booking-inline-note animate-in" role="status" aria-live="polite">
          {flowNotice}
        </div>
      )}

      {branchResetNotice && (
        <div className="booking-inline-note booking-inline-note-muted animate-in" role="status" aria-live="polite">
          {branchResetNotice}
        </div>
      )}

      {availabilityNote && (
        <div className="booking-inline-note booking-inline-note-ok animate-in" role="status" aria-live="polite">
          {availabilityNote}
        </div>
      )}
    </>
  );
}
