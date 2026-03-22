"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  submitCreateMaintenanceIssue,
  submitUpdateMaintenanceIssueStatus,
  type AdminInventoryOverview,
  type AdminMaintenanceIssue,
} from "@/lib/admin-inventory-api";
import { AdminReadinessSnapshotView } from "./AdminReadinessSnapshotView";
import { isCreateIssueDisabled, isUpdateIssueDisabled } from "./admin-readiness-view-model";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to complete the request right now.";
}

export function AdminReadinessPanel() {
  const [overview, setOverview] = useState<AdminInventoryOverview | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const [createForm, setCreateForm] = useState({
    flatId: "mayfair",
    inventoryItemId: "",
    title: "",
    notes: "",
    severity: "important" as "critical" | "important" | "minor",
  });

  const [updateForm, setUpdateForm] = useState({
    issueId: "",
    status: "in_progress" as AdminMaintenanceIssue["status"],
    notes: "",
  });

  const loadOverview = useCallback(async (mode: "initial" | "refresh"): Promise<void> => {
    if (mode === "initial") {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const next = await fetchAdminInventoryOverview();
      setOverview(next);

      setCreateForm((current) => {
        if (next.flats.some((flat) => flat.id === current.flatId)) {
          return current;
        }

        return {
          ...current,
          flatId: next.flats[0]?.id ?? "mayfair",
        };
      });

      setUpdateForm((current) => {
        if (next.maintenanceIssues.some((issue) => issue.id === current.issueId)) {
          return current;
        }

        return {
          ...current,
          issueId: next.maintenanceIssues[0]?.id ?? "",
        };
      });

      setLoadError(null);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      if (mode === "initial") {
        setIsInitialLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadOverview("initial");
  }, [loadOverview]);

  const selectableItems = useMemo(() => {
    if (!overview) {
      return [];
    }

    return overview.inventoryCatalog;
  }, [overview]);

  const createDisabled = isCreateIssueDisabled({
    isSubmitting,
    flatId: createForm.flatId,
    title: createForm.title,
    severity: createForm.severity,
  });

  const updateDisabled = isUpdateIssueDisabled({
    isSubmitting,
    issueId: updateForm.issueId,
    status: updateForm.status,
  });

  async function handleCreateIssue(): Promise<void> {
    if (createDisabled) {
      return;
    }

    setNotice(null);
    setIsSubmitting(true);

    try {
      await submitCreateMaintenanceIssue({
        flatId: createForm.flatId as "windsor" | "kensington" | "mayfair",
        inventoryItemId: createForm.inventoryItemId || null,
        title: createForm.title,
        notes: createForm.notes || null,
        severity: createForm.severity,
        idempotencyKey: createAdminInventoryIdempotencyKey("inventory-issue-create"),
      });

      setNotice({
        tone: "ok",
        message: "Maintenance issue created.",
      });

      setCreateForm((current) => ({
        ...current,
        title: "",
        notes: "",
      }));

      await loadOverview("refresh");
    } catch (error) {
      setNotice({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateIssue(): Promise<void> {
    if (updateDisabled) {
      return;
    }

    setNotice(null);
    setIsSubmitting(true);

    try {
      await submitUpdateMaintenanceIssueStatus({
        issueId: updateForm.issueId,
        status: updateForm.status,
        notes: updateForm.notes || null,
        idempotencyKey: createAdminInventoryIdempotencyKey("inventory-issue-update"),
      });

      setNotice({
        tone: "ok",
        message: "Maintenance issue updated.",
      });

      await loadOverview("refresh");
    } catch (error) {
      setNotice({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-readiness-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Flat Readiness
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Monitor component-level readiness, review alerts, and keep maintenance tracking up to date.
          </p>
        </div>

        <div className="admin-notifications-toolbar-controls">
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={isInitialLoading || isRefreshing || isSubmitting}
            onClick={() => void loadOverview("refresh")}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Readiness"}
          </button>
        </div>
      </section>

      {loadError && <div className="booking-inline-note booking-inline-note-muted">{loadError}</div>}
      {notice && (
        <div className={`booking-inline-note ${notice.tone === "ok" ? "booking-inline-note-ok" : "booking-inline-note-muted"}`}>
          {notice.message}
        </div>
      )}

      <section className="admin-bookings-section" aria-labelledby="readiness-actions-heading">
        <div className="admin-bookings-section-header">
          <h3 id="readiness-actions-heading" className="heading-sm" style={{ margin: 0 }}>
            Maintenance Actions
          </h3>
          <span className="admin-count-pill">Operational</span>
        </div>

        <div className="admin-grid-two">
          <form
            className="admin-form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateIssue();
            }}
          >
            <p className="admin-meta-label">Create Maintenance Issue</p>

            <select
              className="standard-input"
              value={createForm.flatId}
              onChange={(event) => setCreateForm((current) => ({ ...current, flatId: event.target.value }))}
              disabled={isSubmitting}
            >
              {(overview?.flats ?? []).map((flat) => (
                <option key={flat.id} value={flat.id}>
                  {flat.name}
                </option>
              ))}
            </select>

            <select
              className="standard-input"
              value={createForm.inventoryItemId}
              onChange={(event) => setCreateForm((current) => ({ ...current, inventoryItemId: event.target.value }))}
              disabled={isSubmitting}
            >
              <option value="">No linked item</option>
              {selectableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <input
              className="standard-input"
              value={createForm.title}
              onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Issue title"
              disabled={isSubmitting}
            />

            <select
              className="standard-input"
              value={createForm.severity}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  severity: event.target.value as "critical" | "important" | "minor",
                }))
              }
              disabled={isSubmitting}
            >
              <option value="critical">Critical</option>
              <option value="important">Important</option>
              <option value="minor">Minor</option>
            </select>

            <textarea
              className="standard-input"
              rows={3}
              value={createForm.notes}
              onChange={(event) => setCreateForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Notes (optional)"
              disabled={isSubmitting}
            />

            <button type="submit" className="btn btn-primary" disabled={createDisabled}>
              {isSubmitting ? "Submitting..." : "Create Issue"}
            </button>
          </form>

          <form
            className="admin-form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void handleUpdateIssue();
            }}
          >
            <p className="admin-meta-label">Update Issue Status</p>

            <select
              className="standard-input"
              value={updateForm.issueId}
              onChange={(event) => setUpdateForm((current) => ({ ...current, issueId: event.target.value }))}
              disabled={isSubmitting}
            >
              <option value="">Select issue</option>
              {(overview?.maintenanceIssues ?? []).map((issue) => (
                <option key={issue.id} value={issue.id}>
                  {issue.title} ({issue.status})
                </option>
              ))}
            </select>

            <select
              className="standard-input"
              value={updateForm.status}
              onChange={(event) =>
                setUpdateForm((current) => ({
                  ...current,
                  status: event.target.value as AdminMaintenanceIssue["status"],
                }))
              }
              disabled={isSubmitting}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <textarea
              className="standard-input"
              rows={3}
              value={updateForm.notes}
              onChange={(event) => setUpdateForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Update note"
              disabled={isSubmitting}
            />

            <button type="submit" className="btn btn-outline-primary" disabled={updateDisabled}>
              {isSubmitting ? "Updating..." : "Update Issue"}
            </button>
          </form>
        </div>
      </section>

      {isInitialLoading ? (
        <div className="booking-inline-note booking-inline-note-soft">Loading readiness dashboard...</div>
      ) : overview ? (
        <AdminReadinessSnapshotView overview={overview} />
      ) : (
        <div className="booking-inline-note booking-inline-note-muted">Readiness dashboard is not available yet.</div>
      )}
    </div>
  );
}
