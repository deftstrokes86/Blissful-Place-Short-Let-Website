import type { AdminMaintenanceIssue } from "@/lib/admin-inventory-api";
import { formatLagosDateTime } from "../admin/inventory/admin-inventory-view-model";

interface StaffMaintenanceSnapshotViewProps {
  issues: AdminMaintenanceIssue[];
  noteDrafts: Record<string, string>;
  isSubmittingIssueId: string | null;
  onNoteDraftChange: (issueId: string, note: string) => void;
  onMarkInProgress: (issueId: string) => Promise<void>;
  onMarkFixed: (issueId: string) => Promise<void>;
  onEscalate: (issueId: string) => Promise<void>;
}

function formatIssueStatus(status: AdminMaintenanceIssue["status"]): string {
  if (status === "in_progress") {
    return "In Progress";
  }

  return status[0].toUpperCase() + status.slice(1);
}

export function StaffMaintenanceSnapshotView(input: StaffMaintenanceSnapshotViewProps) {
  return (
    <section className="admin-bookings-section" aria-labelledby="staff-maintenance-heading">
      <div className="admin-bookings-section-header">
        <h2 id="staff-maintenance-heading" className="heading-sm" style={{ margin: 0 }}>
          Maintenance Work
        </h2>
        <span className="admin-count-pill">{input.issues.length} issues</span>
      </div>

      {input.issues.length === 0 ? (
        <p className="text-secondary">No maintenance issues assigned right now.</p>
      ) : (
        <div className="admin-bookings-list">
          {input.issues.map((issue) => {
            const noteDraft = input.noteDrafts[issue.id] ?? issue.notes ?? "";
            const isSubmitting = input.isSubmittingIssueId === issue.id;

            return (
              <article key={issue.id} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{issue.title}</p>
                  <span className="admin-status-pill">{formatIssueStatus(issue.status)}</span>
                </div>

                <p className="admin-notification-summary">{issue.notes ?? "No note provided."}</p>
                <p className="text-secondary" style={{ fontSize: "0.83rem" }}>
                  Flat {issue.flatId} | Created {formatLagosDateTime(issue.createdAt)}
                </p>

                <label className="admin-label" htmlFor={`staff-maintenance-note-${issue.id}`}>
                  Add Note
                </label>
                <textarea
                  id={`staff-maintenance-note-${issue.id}`}
                  className="standard-input"
                  rows={2}
                  value={noteDraft}
                  onChange={(event) => input.onNoteDraftChange(issue.id, event.target.value)}
                  disabled={isSubmitting}
                />

                <div className="admin-bookings-actions-row">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-full"
                    disabled={isSubmitting}
                    onClick={() => {
                      void input.onMarkInProgress(issue.id);
                    }}
                  >
                    Mark In Progress
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-full"
                    disabled={isSubmitting}
                    onClick={() => {
                      void input.onMarkFixed(issue.id);
                    }}
                  >
                    Mark Fixed
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-full"
                    disabled={isSubmitting}
                    onClick={() => {
                      void input.onEscalate(issue.id);
                    }}
                  >
                    Escalate
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
