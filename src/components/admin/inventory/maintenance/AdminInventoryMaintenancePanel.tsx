"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  submitCreateInventoryWorkerTask,
  submitUpdateMaintenanceIssueStatus,
  type AdminInventoryOverview,
  type AdminMaintenanceIssue,
} from "@/lib/admin-inventory-api";
import { AdminInventoryMaintenanceSnapshotView } from "./AdminInventoryMaintenanceSnapshotView";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to complete maintenance action right now.";
}

export function AdminInventoryMaintenancePanel() {
  const [overview, setOverview] = useState<AdminInventoryOverview | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, AdminMaintenanceIssue["status"]>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);

    try {
      const next = await fetchAdminInventoryOverview();
      setOverview(next);

      setStatusDrafts(Object.fromEntries(next.maintenanceIssues.map((issue) => [issue.id, issue.status])));
      setNoteDrafts(Object.fromEntries(next.maintenanceIssues.map((issue) => [issue.id, issue.notes ?? ""])));
      setNotice(null);
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function handleUpdateIssue(issueId: string): Promise<void> {
    const status = statusDrafts[issueId];
    if (!status) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitUpdateMaintenanceIssueStatus({
        issueId,
        status,
        notes: noteDrafts[issueId]?.trim() || null,
        idempotencyKey: createAdminInventoryIdempotencyKey("maintenance-issue-update"),
      });

      setNotice({ tone: "ok", message: "Issue updated." });
      await loadOverview();
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResolveIssue(issueId: string): Promise<void> {
    setStatusDrafts((current) => ({
      ...current,
      [issueId]: "resolved",
    }));

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitUpdateMaintenanceIssueStatus({
        issueId,
        status: "resolved",
        notes: noteDrafts[issueId]?.trim() || "Resolved from maintenance operations page.",
        idempotencyKey: createAdminInventoryIdempotencyKey("maintenance-issue-resolve"),
      });

      setNotice({ tone: "ok", message: "Issue resolved." });
      await loadOverview();
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEscalateIssue(issueId: string): Promise<void> {
    if (!overview) {
      return;
    }

    const issue = overview.maintenanceIssues.find((entry) => entry.id === issueId);
    if (!issue) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitCreateInventoryWorkerTask({
        flatId: issue.flatId,
        title: `Escalated: ${issue.title}`,
        description: `Issue ${issue.id} escalated from admin maintenance page. ${noteDrafts[issue.id] ?? ""}`.trim(),
        taskType: "maintenance",
        priority: "critical",
        assignedTo: null,
        idempotencyKey: createAdminInventoryIdempotencyKey("maintenance-issue-escalate"),
      });

      setNotice({ tone: "ok", message: "Issue escalated to worker task queue." });
      await loadOverview();
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-inventory-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Maintenance Operations
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Move issues forward with clear status updates, fast resolution, and escalation when needed.
          </p>
        </div>

        <div className="admin-bookings-toolbar-controls">
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={isLoading || isSubmitting}
            onClick={() => {
              void loadOverview();
            }}
          >
            {isLoading ? "Refreshing..." : "Refresh Issues"}
          </button>
        </div>
      </section>

      {notice ? (
        <div className={`booking-inline-note ${notice.tone === "ok" ? "booking-inline-note-ok" : "booking-inline-note-muted"}`}>
          {notice.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="booking-inline-note booking-inline-note-soft">Loading maintenance issues...</div>
      ) : !overview ? (
        <div className="booking-inline-note booking-inline-note-muted">Maintenance view is unavailable.</div>
      ) : (
        <AdminInventoryMaintenanceSnapshotView
          issues={overview.maintenanceIssues}
          inventoryItems={overview.inventoryCatalog}
          statusDrafts={statusDrafts}
          noteDrafts={noteDrafts}
          isSubmitting={isSubmitting}
          onStatusDraftChange={(issueId, status) => {
            setStatusDrafts((current) => ({
              ...current,
              [issueId]: status,
            }));
          }}
          onNoteDraftChange={(issueId, note) => {
            setNoteDrafts((current) => ({
              ...current,
              [issueId]: note,
            }));
          }}
          onUpdateIssue={handleUpdateIssue}
          onResolveIssue={handleResolveIssue}
          onEscalateIssue={handleEscalateIssue}
        />
      )}
    </div>
  );
}
