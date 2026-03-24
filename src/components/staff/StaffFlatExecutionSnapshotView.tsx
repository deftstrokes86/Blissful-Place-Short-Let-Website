import type { AdminWorkerTask } from "@/lib/admin-inventory-api";

import { formatWorkerTaskStatus } from "../tasks/worker-task-view-model";
import { formatReadinessPill, type FlatChecklistDraft } from "./staff-worker-view-model";

interface StaffFlatExecutionSnapshotViewProps {
  flatLabel: string;
  readinessStatus: "ready" | "needs_attention" | "out_of_service" | null;
  tasks: AdminWorkerTask[];
  checklistDraft: FlatChecklistDraft;
  issueNote: string;
  isSubmitting: boolean;
  onChecklistToggle: (key: keyof FlatChecklistDraft, checked: boolean) => void;
  onIssueNoteChange: (note: string) => void;
  onMarkComplete: () => Promise<void>;
  onReportProblem: () => Promise<void>;
  onMarkCannotComplete: () => Promise<void>;
  onNeedSupplies: () => Promise<void>;
  onEscalate: () => Promise<void>;
}

export function StaffFlatExecutionSnapshotView(input: StaffFlatExecutionSnapshotViewProps) {
  return (
    <div className="admin-readiness-panel">
      <section className="admin-bookings-section" aria-labelledby="staff-flat-execution-heading">
        <div className="admin-bookings-section-header">
          <h2 id="staff-flat-execution-heading" className="heading-sm" style={{ margin: 0 }}>
            Flat Execution
          </h2>
          <span className="admin-count-pill">{input.flatLabel}</span>
        </div>

        <p className="text-secondary" style={{ fontSize: "0.9rem" }}>
          Readiness: {formatReadinessPill(input.readinessStatus)}
        </p>

        <div className="admin-mini-table">
          <label className="admin-mini-table-row" htmlFor="staff-check-cleaning">
            <span>Cleaning Checklist</span>
            <input
              id="staff-check-cleaning"
              type="checkbox"
              style={{ width: "1.2rem", height: "1.2rem" }}
              checked={input.checklistDraft.cleaning}
              onChange={(event) => input.onChecklistToggle("cleaning", event.target.checked)}
              disabled={input.isSubmitting}
            />
          </label>

          <label className="admin-mini-table-row" htmlFor="staff-check-linen">
            <span>Linen Checklist</span>
            <input
              id="staff-check-linen"
              type="checkbox"
              style={{ width: "1.2rem", height: "1.2rem" }}
              checked={input.checklistDraft.linen}
              onChange={(event) => input.onChecklistToggle("linen", event.target.checked)}
              disabled={input.isSubmitting}
            />
          </label>

          <label className="admin-mini-table-row" htmlFor="staff-check-consumables">
            <span>Consumables Checklist</span>
            <input
              id="staff-check-consumables"
              type="checkbox"
              style={{ width: "1.2rem", height: "1.2rem" }}
              checked={input.checklistDraft.consumables}
              onChange={(event) => input.onChecklistToggle("consumables", event.target.checked)}
              disabled={input.isSubmitting}
            />
          </label>
        </div>

        <label className="admin-label" htmlFor="staff-flat-issue-note">
          Quick Note
        </label>
        <textarea
          id="staff-flat-issue-note"
          className="standard-input"
          rows={3}
          value={input.issueNote}
          onChange={(event) => input.onIssueNoteChange(event.target.value)}
          placeholder="Add details for any problem or shortage"
          disabled={input.isSubmitting}
        />

        <div className="admin-bookings-actions-stack">
          <button
            type="button"
            className="btn btn-primary btn-full"
            disabled={input.isSubmitting}
            onClick={() => {
              void input.onMarkComplete();
            }}
          >
            Mark Complete
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-full"
            disabled={input.isSubmitting}
            onClick={() => {
              void input.onReportProblem();
            }}
          >
            Report Problem
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-full"
            disabled={input.isSubmitting}
            onClick={() => {
              void input.onMarkCannotComplete();
            }}
          >
            Cannot Complete
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-full"
            disabled={input.isSubmitting}
            onClick={() => {
              void input.onNeedSupplies();
            }}
          >
            Need Supplies
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-full"
            disabled={input.isSubmitting}
            onClick={() => {
              void input.onEscalate();
            }}
          >
            Escalate
          </button>
        </div>
      </section>

      <section className="admin-bookings-section" aria-labelledby="staff-flat-active-tasks-heading">
        <div className="admin-bookings-section-header">
          <h3 id="staff-flat-active-tasks-heading" className="heading-sm" style={{ margin: 0 }}>
            Active Tasks
          </h3>
          <span className="admin-count-pill">{input.tasks.length}</span>
        </div>

        {input.tasks.length === 0 ? (
          <p className="text-secondary">No active flat tasks right now.</p>
        ) : (
          <div className="admin-bookings-list">
            {input.tasks.map((task) => (
              <article key={task.id} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{task.title}</p>
                  <span className="admin-status-pill">{formatWorkerTaskStatus(task.status)}</span>
                </div>
                <p className="admin-notification-summary">{task.description ?? "No details."}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
