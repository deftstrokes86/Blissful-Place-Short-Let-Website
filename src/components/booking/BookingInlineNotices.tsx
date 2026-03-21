interface BookingInlineNoticesProps {
  resumingNotice: string | null;
  restoredNotice: string | null;
  recoveryNotice: string | null;
  flowNotice: string | null;
  branchResetNotice: string | null;
  availabilityNote: string | null;
  showContinueEditingAction: boolean;
  onContinueEditing: () => void;
  onDismissRestoredNotice: () => void;
}

export function BookingInlineNotices({
  resumingNotice,
  restoredNotice,
  recoveryNotice,
  flowNotice,
  branchResetNotice,
  availabilityNote,
  showContinueEditingAction,
  onContinueEditing,
  onDismissRestoredNotice,
}: BookingInlineNoticesProps) {
  return (
    <>
      {resumingNotice && (
        <div className="booking-inline-note booking-inline-note-soft animate-in" role="status" aria-live="polite">
          <span className="booking-inline-dot" aria-hidden>
            <span />
          </span>
          {resumingNotice}
        </div>
      )}

      {restoredNotice && (
        <div className="booking-inline-note booking-inline-note-restored animate-in" role="status" aria-live="polite">
          <div className="booking-inline-note-header">
            <span className="booking-inline-pill">Draft Restored</span>
          </div>
          <p>{restoredNotice}</p>
          <div className="booking-inline-actions">
            {showContinueEditingAction && (
              <button type="button" className="booking-inline-action-link" onClick={onContinueEditing}>
                Continue Editing
              </button>
            )}
            <button type="button" className="booking-inline-action-link muted" onClick={onDismissRestoredNotice}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {recoveryNotice && (
        <div className="booking-inline-note booking-inline-note-recovery animate-in" role="status" aria-live="polite">
          <div className="booking-inline-note-header">
            <span className="booking-inline-pill">Update Stay Details</span>
          </div>
          <p>{recoveryNotice}</p>
          {showContinueEditingAction && (
            <div className="booking-inline-actions">
              <button type="button" className="booking-inline-action-link" onClick={onContinueEditing}>
                Edit Stay Details
              </button>
            </div>
          )}
        </div>
      )}

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
