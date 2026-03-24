"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  submitCreateInventoryWorkerTask,
  submitUpdateMaintenanceIssueStatus,
  type AdminMaintenanceIssue,
} from "@/lib/admin-inventory-api";
import { StaffMaintenanceSnapshotView } from "./StaffMaintenanceSnapshotView";

function isWorkerVisibleIssue(issue: AdminMaintenanceIssue): boolean {
  return issue.status === "open" || issue.status === "in_progress";
}

export function StaffMaintenancePanel() {
  const [issues, setIssues] = useState<AdminMaintenanceIssue[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [isSubmittingIssueId, setIsSubmittingIssueId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const overview = await fetchAdminInventoryOverview();
    const nextIssues = overview.maintenanceIssues.filter(isWorkerVisibleIssue);

    setIssues(nextIssues);
    setNoteDrafts((current) => {
      const next: Record<string, string> = { ...current };
      for (const issue of nextIssues) {
        if (!(issue.id in next)) {
          next[issue.id] = issue.notes ?? "";
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function runLoad(): Promise<void> {
      try {
        await load();
        if (!cancelled) {
          setNotice(null);
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(error instanceof Error ? error.message : "Unable to load maintenance queue.");
        }
      }
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const issueById = useMemo(() => {
    const map = new Map<string, AdminMaintenanceIssue>();
    for (const issue of issues) {
      map.set(issue.id, issue);
    }

    return map;
  }, [issues]);

  async function runIssueAction(issueId: string, action: (issue: AdminMaintenanceIssue) => Promise<void>): Promise<void> {
    if (isSubmittingIssueId) {
      return;
    }

    const issue = issueById.get(issueId);
    if (!issue) {
      setNotice("Issue no longer available.");
      return;
    }

    setIsSubmittingIssueId(issueId);
    setNotice(null);

    try {
      await action(issue);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update maintenance issue.");
    } finally {
      setIsSubmittingIssueId(null);
    }
  }

  async function handleMarkInProgress(issueId: string): Promise<void> {
    await runIssueAction(issueId, async (issue) => {
      const note = (noteDrafts[issue.id] ?? "").trim() || issue.notes || null;

      await submitUpdateMaintenanceIssueStatus({
        issueId: issue.id,
        status: "in_progress",
        notes: note,
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-maintenance-progress"),
      });

      setNotice("Issue marked in progress.");
    });
  }

  async function handleMarkFixed(issueId: string): Promise<void> {
    await runIssueAction(issueId, async (issue) => {
      const note = (noteDrafts[issue.id] ?? "").trim() || "Marked fixed by worker.";

      await submitUpdateMaintenanceIssueStatus({
        issueId: issue.id,
        status: "resolved",
        notes: note,
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-maintenance-fixed"),
      });

      setNotice("Issue marked fixed.");
    });
  }

  async function handleEscalate(issueId: string): Promise<void> {
    await runIssueAction(issueId, async (issue) => {
      const note = (noteDrafts[issue.id] ?? "").trim() || "Worker escalation requested.";

      await submitCreateInventoryWorkerTask({
        flatId: issue.flatId,
        title: `Escalated: ${issue.title}`,
        description: note,
        taskType: "maintenance",
        priority: "critical",
        assignedTo: null,
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-maintenance-escalate-task"),
      });

      await submitUpdateMaintenanceIssueStatus({
        issueId: issue.id,
        status: "in_progress",
        notes: `Escalated by worker. ${note}`,
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-maintenance-escalate-status"),
      });

      setNotice("Issue escalated.");
    });
  }

  return (
    <div className="admin-readiness-panel">
      {notice ? <div className="booking-inline-note booking-inline-note-soft">{notice}</div> : null}

      <StaffMaintenanceSnapshotView
        issues={issues}
        noteDrafts={noteDrafts}
        isSubmittingIssueId={isSubmittingIssueId}
        onNoteDraftChange={(issueId, note) => {
          setNoteDrafts((current) => ({
            ...current,
            [issueId]: note,
          }));
        }}
        onMarkInProgress={handleMarkInProgress}
        onMarkFixed={handleMarkFixed}
        onEscalate={handleEscalate}
      />
    </div>
  );
}
