import type { FlatId } from "@/types/booking";

import { STAFF_ISSUE_TYPE_OPTIONS, type StaffIssueType } from "./staff-worker-view-model";

export interface StaffIssueFormState {
  flatId: FlatId;
  issueType: StaffIssueType;
  severity: "critical" | "important" | "minor";
  note: string;
}

interface StaffIssueSnapshotViewProps {
  flats: Array<{ id: FlatId; name: string }> | null | undefined;
  form: StaffIssueFormState;
  isSubmitting: boolean;
  onFormChange: (next: StaffIssueFormState) => void;
  onSubmit: () => Promise<void>;
}

export function StaffIssueSnapshotView({ flats: inputFlats, form, isSubmitting, onFormChange, onSubmit }: StaffIssueSnapshotViewProps) {
  const flats = Array.isArray(inputFlats) ? inputFlats : [];

  return (
    <section className="admin-bookings-section" aria-labelledby="staff-issue-form-heading">
      <div className="admin-bookings-section-header">
        <h2 id="staff-issue-form-heading" className="heading-sm" style={{ margin: 0 }}>
          Report an Issue
        </h2>
        <span className="admin-count-pill">Quick Form</span>
      </div>

      <div className="admin-form-grid">
        <label className="admin-label" htmlFor="staff-issue-flat">
          Choose Flat
        </label>
        <select
          id="staff-issue-flat"
          className="standard-input"
          value={form.flatId}
          onChange={(event) => onFormChange({ ...form, flatId: event.target.value as FlatId })}
          disabled={isSubmitting}
        >
          {flats.length === 0 ? <option value={form.flatId}>{form.flatId}</option> : null}
          {flats.map((flat) => (
            <option key={flat.id} value={flat.id}>
              {flat.name}
            </option>
          ))}
        </select>

        <label className="admin-label" htmlFor="staff-issue-type">
          Issue Type
        </label>
        <select
          id="staff-issue-type"
          className="standard-input"
          value={form.issueType}
          onChange={(event) => onFormChange({ ...form, issueType: event.target.value as StaffIssueType })}
          disabled={isSubmitting}
        >
          {STAFF_ISSUE_TYPE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="admin-label" htmlFor="staff-issue-severity">
          Severity
        </label>
        <select
          id="staff-issue-severity"
          className="standard-input"
          value={form.severity}
          onChange={(event) =>
            onFormChange({
              ...form,
              severity: event.target.value as StaffIssueFormState["severity"],
            })
          }
          disabled={isSubmitting}
        >
          <option value="critical">High</option>
          <option value="important">Medium</option>
          <option value="minor">Low</option>
        </select>

        <label className="admin-label" htmlFor="staff-issue-note">
          Short Note
        </label>
        <textarea
          id="staff-issue-note"
          className="standard-input"
          rows={4}
          value={form.note}
          onChange={(event) => onFormChange({ ...form, note: event.target.value })}
          placeholder="What is wrong and what have you checked?"
          disabled={isSubmitting}
        />

        <button
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => {
            void onSubmit();
          }}
          disabled={isSubmitting || form.note.trim().length === 0}
        >
          {isSubmitting ? "Submitting..." : "Submit Issue"}
        </button>
      </div>
    </section>
  );
}
