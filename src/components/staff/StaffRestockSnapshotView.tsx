import { type RestockEntry, parseNonNegativeInteger } from "./staff-worker-view-model";

interface StaffRestockSnapshotViewProps {
  entries: RestockEntry[] | null | undefined;
  quantityDrafts: Record<string, string> | null | undefined;
  noteDrafts: Record<string, string> | null | undefined;
  isSubmittingRecordId: string | null;
  onQuantityDraftChange: (recordId: string, value: string) => void;
  onNoteDraftChange: (recordId: string, value: string) => void;
  onMarkRestocked: (entry: RestockEntry) => Promise<void>;
  onReportShortage: (entry: RestockEntry) => Promise<void>;
}

export function StaffRestockSnapshotView(input: StaffRestockSnapshotViewProps) {
  const entries = Array.isArray(input.entries) ? input.entries : [];
  const quantityDrafts = input.quantityDrafts ?? {};
  const noteDrafts = input.noteDrafts ?? {};

  return (
    <section className="admin-bookings-section" aria-labelledby="staff-restock-heading">
      <div className="admin-bookings-section-header">
        <h2 id="staff-restock-heading" className="heading-sm" style={{ margin: 0 }}>
          Needs Restock
        </h2>
        <span className="admin-count-pill">{entries.length} items</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-secondary">No flats need restock right now.</p>
      ) : (
        <div className="admin-bookings-list">
          {entries.map((entry, index) => {
            const entryKey = entry.recordId?.trim() || `restock-entry-${index}`;
            const quantityDraft = quantityDrafts[entry.recordId] ?? String(entry.neededQuantity ?? 0);
            const noteDraft = noteDrafts[entry.recordId] ?? entry.note ?? "";
            const quantityInvalid = parseNonNegativeInteger(quantityDraft) === null;
            const itemLabel = entry.itemName?.trim() || "Inventory item";
            const flatLabel = entry.flatName?.trim() || entry.flatId || "Flat";

            return (
              <article key={entryKey} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{itemLabel}</p>
                  <span className="admin-count-pill">{flatLabel}</span>
                </div>

                <div className="admin-notifications-meta-grid">
                  <div>
                    <p className="admin-meta-label">Current</p>
                    <p>{entry.currentQuantity ?? 0}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Expected</p>
                    <p>{entry.expectedQuantity ?? 0}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Needed</p>
                    <p>{entry.neededQuantity ?? 0}</p>
                  </div>
                </div>

                <label className="admin-label" htmlFor={`staff-restock-qty-${entryKey}`}>
                  Added Quantity
                </label>
                <input
                  id={`staff-restock-qty-${entryKey}`}
                  className="standard-input"
                  inputMode="numeric"
                  value={quantityDraft}
                  onChange={(event) => input.onQuantityDraftChange(entry.recordId, event.target.value)}
                  disabled={input.isSubmittingRecordId === entry.recordId}
                />

                <label className="admin-label" htmlFor={`staff-restock-note-${entryKey}`}>
                  Note shortage or problem
                </label>
                <textarea
                  id={`staff-restock-note-${entryKey}`}
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
