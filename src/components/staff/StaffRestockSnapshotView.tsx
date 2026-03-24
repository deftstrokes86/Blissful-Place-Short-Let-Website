import { type RestockEntry, parseNonNegativeInteger } from "./staff-worker-view-model";

interface StaffRestockSnapshotViewProps {
  entries: RestockEntry[];
  quantityDrafts: Record<string, string>;
  noteDrafts: Record<string, string>;
  isSubmittingRecordId: string | null;
  onQuantityDraftChange: (recordId: string, value: string) => void;
  onNoteDraftChange: (recordId: string, value: string) => void;
  onMarkRestocked: (entry: RestockEntry) => Promise<void>;
  onReportShortage: (entry: RestockEntry) => Promise<void>;
}

export function StaffRestockSnapshotView(input: StaffRestockSnapshotViewProps) {
  return (
    <section className="admin-bookings-section" aria-labelledby="staff-restock-heading">
      <div className="admin-bookings-section-header">
        <h2 id="staff-restock-heading" className="heading-sm" style={{ margin: 0 }}>
          Needs Restock
        </h2>
        <span className="admin-count-pill">{input.entries.length} items</span>
      </div>

      {input.entries.length === 0 ? (
        <p className="text-secondary">No flats need restock right now.</p>
      ) : (
        <div className="admin-bookings-list">
          {input.entries.map((entry) => {
            const quantityDraft = input.quantityDrafts[entry.recordId] ?? String(entry.neededQuantity);
            const noteDraft = input.noteDrafts[entry.recordId] ?? entry.note;
            const quantityInvalid = parseNonNegativeInteger(quantityDraft) === null;

            return (
              <article key={entry.recordId} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{entry.itemName}</p>
                  <span className="admin-count-pill">{entry.flatName}</span>
                </div>

                <div className="admin-notifications-meta-grid">
                  <div>
                    <p className="admin-meta-label">Current</p>
                    <p>{entry.currentQuantity}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Expected</p>
                    <p>{entry.expectedQuantity}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Needed</p>
                    <p>{entry.neededQuantity}</p>
                  </div>
                </div>

                <label className="admin-label" htmlFor={`staff-restock-qty-${entry.recordId}`}>
                  Added Quantity
                </label>
                <input
                  id={`staff-restock-qty-${entry.recordId}`}
                  className="standard-input"
                  inputMode="numeric"
                  value={quantityDraft}
                  onChange={(event) => input.onQuantityDraftChange(entry.recordId, event.target.value)}
                  disabled={input.isSubmittingRecordId === entry.recordId}
                />

                <label className="admin-label" htmlFor={`staff-restock-note-${entry.recordId}`}>
                  Note shortage or problem
                </label>
                <textarea
                  id={`staff-restock-note-${entry.recordId}`}
                  className="standard-input"
                  rows={2}
                  value={noteDraft}
                  onChange={(event) => input.onNoteDraftChange(entry.recordId, event.target.value)}
                  disabled={input.isSubmittingRecordId === entry.recordId}
                />

                <div className="admin-bookings-actions-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-full"
                    disabled={input.isSubmittingRecordId === entry.recordId || quantityInvalid}
                    onClick={() => {
                      void input.onMarkRestocked(entry);
                    }}
                  >
                    Mark Restocked
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-full"
                    disabled={input.isSubmittingRecordId === entry.recordId}
                    onClick={() => {
                      void input.onReportShortage(entry);
                    }}
                  >
                    Report Shortage
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
