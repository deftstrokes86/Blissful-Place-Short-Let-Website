"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  fetchInventoryWorkerTasks,
  submitCreateInventoryWorkerTask,
  submitCreateMaintenanceIssue,
  submitUpdateFlatChecklistReadiness,
  submitUpdateInventoryWorkerTaskStatus,
  type AdminWorkerTask,
} from "@/lib/admin-inventory-api";
import type { FlatId } from "@/types/booking";
import {
  findPreferredTaskForFlat,
  isChecklistComplete,
  type FlatChecklistDraft,
} from "./staff-worker-view-model";
import { StaffFlatExecutionSnapshotView } from "./StaffFlatExecutionSnapshotView";

interface StaffFlatPanelProps {
  flatId: FlatId;
}

export function StaffFlatPanel({ flatId }: StaffFlatPanelProps) {
  const [flatLabel, setFlatLabel] = useState<string>(flatId);
  const [readinessStatus, setReadinessStatus] = useState<"ready" | "needs_attention" | "out_of_service" | null>(null);
  const [tasks, setTasks] = useState<AdminWorkerTask[]>([]);
  const [checklistDraft, setChecklistDraft] = useState<FlatChecklistDraft>({
    cleaning: false,
    linen: false,
    consumables: false,
  });
  const [issueNote, setIssueNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [overview, flatTasks] = await Promise.all([
      fetchAdminInventoryOverview(),
      fetchInventoryWorkerTasks({ flatId, sync: true, openOnly: true }),
    ]);

    const flats = Array.isArray(overview?.flats) ? overview.flats : [];
    const readinessEntries = Array.isArray(overview?.readiness) ? overview.readiness : [];
    const safeTasks = Array.isArray(flatTasks) ? flatTasks : [];
    const flat = flats.find((entry) => entry.id === flatId);
    const readiness = readinessEntries.find((entry) => entry.flatId === flatId)?.readiness ?? null;

    setFlatLabel(flat?.name ?? flatId);
    setReadinessStatus(readiness?.readinessStatus ?? null);
    setChecklistDraft({
      cleaning: readiness?.cleaningStatus === "ready",
      linen: readiness?.linenStatus === "ready",
      consumables: readiness?.consumablesStatus === "ready",
    });
    setTasks(safeTasks);
  }, [flatId]);

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
          setNotice(error instanceof Error ? error.message : "Unable to load flat execution view.");
        }
      }
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
  }, [load]);

  async function ensureTask(
    preferredType: AdminWorkerTask["taskType"],
    title: string,
    description: string,
    priority: AdminWorkerTask["priority"]
  ): Promise<AdminWorkerTask> {
    const existing = findPreferredTaskForFlat(tasks, flatId, [preferredType, "readiness", "inspection", "maintenance", "restock"]);
    if (existing) {
      return existing;
    }

    return submitCreateInventoryWorkerTask({
      flatId,
      title,
      description,
      taskType: preferredType,
      priority,
      assignedTo: null,
      idempotencyKey: createAdminInventoryIdempotencyKey("staff-flat-task-create"),
    });
  }

  async function updateTaskStatus(task: AdminWorkerTask, status: AdminWorkerTask["status"]): Promise<void> {
    await submitUpdateInventoryWorkerTaskStatus({
      taskId: task.id,
      status,
      assignedTo: task.assignedTo,
      idempotencyKey: createAdminInventoryIdempotencyKey("staff-flat-task-status"),
    });
  }

  async function syncChecklistReadiness(): Promise<void> {
    await submitUpdateFlatChecklistReadiness({
      flatId,
      cleaningCompleted: checklistDraft.cleaning,
      linenCompleted: checklistDraft.linen,
      consumablesCompleted: checklistDraft.consumables,
    });
  }

  async function runAction(action: () => Promise<void>): Promise<void> {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await action();
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to complete action.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMarkComplete(): Promise<void> {
    await runAction(async () => {
      if (!isChecklistComplete(checklistDraft)) {
        throw new Error("Complete cleaning, linen, and consumables checklist first.");
      }

      await syncChecklistReadiness();

      const task = await ensureTask(
        "readiness",
        "Flat checklist completion",
        "Worker confirmed cleaning, linen, and consumables checklist.",
        "important"
      );

      await updateTaskStatus(task, "completed");
      setIssueNote("");
      setNotice("Flat checklist marked complete.");
    });
  }

  async function handleReportProblem(): Promise<void> {
    await runAction(async () => {
      const note = issueNote.trim();
      if (!note) {
        throw new Error("Add a short note before reporting a problem.");
      }

      await syncChecklistReadiness();

      await submitCreateMaintenanceIssue({
        flatId,
        inventoryItemId: null,
        title: "Flat Problem Reported",
        notes: note,
        severity: "important",
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-flat-problem"),
      });

      const task = findPreferredTaskForFlat(tasks, flatId, ["readiness", "inspection", "maintenance"]);
      if (task) {
        await updateTaskStatus(task, "blocked");
      }

      setNotice("Problem reported.");
    });
  }

  async function handleCannotComplete(): Promise<void> {
    await runAction(async () => {
      const note = issueNote.trim() || "Worker marked flat task as cannot complete.";
      await syncChecklistReadiness();

      const task = await ensureTask("readiness", "Flat task blocked", note, "important");
      await updateTaskStatus(task, "blocked");
      setNotice("Task marked as cannot complete.");
    });
  }

  async function handleNeedSupplies(): Promise<void> {
    await runAction(async () => {
      const note = issueNote.trim();
      if (!note) {
        throw new Error("Add a short note describing which supplies are missing.");
      }

      await syncChecklistReadiness();

      await submitCreateMaintenanceIssue({
        flatId,
        inventoryItemId: null,
        title: "Supplies Missing",
        notes: note,
        severity: "important",
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-flat-supplies"),
      });

      const task = await ensureTask("restock", "Supply restock needed", note, "important");
      await updateTaskStatus(task, "blocked");
      setNotice("Supply shortage reported.");
    });
  }

  async function handleEscalate(): Promise<void> {
    await runAction(async () => {
      const note = issueNote.trim() || "Escalation requested by worker.";
      await syncChecklistReadiness();

      await submitCreateMaintenanceIssue({
        flatId,
        inventoryItemId: null,
        title: "Escalation Required",
        notes: note,
        severity: "critical",
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-flat-escalate"),
      });

      const task = await ensureTask("maintenance", "Escalated flat issue", note, "critical");
      await updateTaskStatus(task, "escalated");
      setNotice("Issue escalated.");
    });
  }

  return (
    <div className="admin-readiness-panel">
      {notice ? <div className="booking-inline-note booking-inline-note-soft">{notice}</div> : null}

      <StaffFlatExecutionSnapshotView
        flatLabel={flatLabel}
        readinessStatus={readinessStatus}
        tasks={tasks}
        checklistDraft={checklistDraft}
        issueNote={issueNote}
        isSubmitting={isSubmitting}
        onChecklistToggle={(key, checked) => {
          setChecklistDraft((current) => ({
            ...current,
            [key]: checked,
          }));
        }}
        onIssueNoteChange={setIssueNote}
        onMarkComplete={handleMarkComplete}
        onReportProblem={handleReportProblem}
        onMarkCannotComplete={handleCannotComplete}
        onNeedSupplies={handleNeedSupplies}
        onEscalate={handleEscalate}
      />
    </div>
  );
}
