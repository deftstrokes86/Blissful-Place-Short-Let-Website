"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  fetchInventoryWorkerTasks,
  submitCreateMaintenanceIssue,
  submitFlatInventoryReconciliationAction,
  submitUpdateInventoryWorkerTaskStatus,
  type AdminWorkerTask,
} from "@/lib/admin-inventory-api";
import { StaffRestockSnapshotView } from "./StaffRestockSnapshotView";
import {
  buildRestockEntries,
  findPreferredTaskForFlat,
  parseNonNegativeInteger,
  type RestockEntry,
} from "./staff-worker-view-model";

export function StaffRestockPanel() {
  const [entries, setEntries] = useState<RestockEntry[]>([]);
  const [tasks, setTasks] = useState<AdminWorkerTask[]>([]);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [isSubmittingRecordId, setIsSubmittingRecordId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [overview, workerTasks] = await Promise.all([
      fetchAdminInventoryOverview(),
      fetchInventoryWorkerTasks({ sync: true, openOnly: true }),
    ]);

    const nextEntries: RestockEntry[] = [];
    for (const flatInventory of overview.flatInventory) {
      nextEntries.push(...buildRestockEntries(flatInventory.records, flatInventory.flatId, flatInventory.flatName));
    }

    setEntries(nextEntries);
    setTasks(workerTasks);
    setQuantityDrafts((current) => {
      const next: Record<string, string> = { ...current };
      for (const entry of nextEntries) {
        if (!(entry.recordId in next)) {
          next[entry.recordId] = String(entry.neededQuantity);
        }
      }
      return next;
    });
    setNoteDrafts((current) => {
      const next: Record<string, string> = { ...current };
      for (const entry of nextEntries) {
        if (!(entry.recordId in next)) {
          next[entry.recordId] = entry.note;
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
          setNotice(error instanceof Error ? error.message : "Unable to load restock queue.");
        }
      }
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const entryById = useMemo(() => {
    const map = new Map<string, RestockEntry>();
    for (const entry of entries) {
      map.set(entry.recordId, entry);
    }

    return map;
  }, [entries]);

  async function runRecordAction(recordId: string, action: () => Promise<void>): Promise<void> {
    if (isSubmittingRecordId) {
      return;
    }

    setIsSubmittingRecordId(recordId);
    setNotice(null);

    try {
      await action();
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update restock item.");
    } finally {
      setIsSubmittingRecordId(null);
    }
  }

  async function handleMarkRestocked(entry: RestockEntry): Promise<void> {
    await runRecordAction(entry.recordId, async () => {
      const added = parseNonNegativeInteger(quantityDrafts[entry.recordId] ?? "");
      if (added === null) {
        throw new Error("Enter a valid added quantity.");
      }

      const targetQuantity = entry.currentQuantity + added;

      await submitFlatInventoryReconciliationAction({
        flatId: entry.flatId,
        flatInventoryId: entry.recordId,
        action: "restocked_now",
        quantity: targetQuantity,
        note: (noteDrafts[entry.recordId] ?? "").trim() || null,
      });

      const task = findPreferredTaskForFlat(tasks, entry.flatId, ["restock"]);
      if (task) {
        await submitUpdateInventoryWorkerTaskStatus({
          taskId: task.id,
          status: "completed",
          assignedTo: task.assignedTo,
          idempotencyKey: createAdminInventoryIdempotencyKey("staff-restock-task-complete"),
        });
      }

      setNotice("Restock recorded.");
    });
  }

  async function handleReportShortage(entry: RestockEntry): Promise<void> {
    await runRecordAction(entry.recordId, async () => {
      const note = (noteDrafts[entry.recordId] ?? "").trim();
      if (!note) {
        throw new Error("Add a short shortage note before reporting.");
      }

      await submitFlatInventoryReconciliationAction({
        flatId: entry.flatId,
        flatInventoryId: entry.recordId,
        action: "note_discrepancy",
        note,
      });

      await submitCreateMaintenanceIssue({
        flatId: entry.flatId,
        inventoryItemId: null,
        title: `Restock Shortage: ${entry.itemName}`,
        notes: note,
        severity: "important",
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-restock-shortage"),
      });

      const task = findPreferredTaskForFlat(tasks, entry.flatId, ["restock"]);
      if (task) {
        await submitUpdateInventoryWorkerTaskStatus({
          taskId: task.id,
          status: "blocked",
          assignedTo: task.assignedTo,
          idempotencyKey: createAdminInventoryIdempotencyKey("staff-restock-task-block"),
        });
      }

      setNotice("Shortage reported.");
    });
  }

  return (
    <div className="admin-readiness-panel">
      {notice ? <div className="booking-inline-note booking-inline-note-soft">{notice}</div> : null}

      <StaffRestockSnapshotView
        entries={Array.from(entryById.values())}
        quantityDrafts={quantityDrafts}
        noteDrafts={noteDrafts}
        isSubmittingRecordId={isSubmittingRecordId}
        onQuantityDraftChange={(recordId, value) => {
          setQuantityDrafts((current) => ({
            ...current,
            [recordId]: value,
          }));
        }}
        onNoteDraftChange={(recordId, value) => {
          setNoteDrafts((current) => ({
            ...current,
            [recordId]: value,
          }));
        }}
        onMarkRestocked={handleMarkRestocked}
        onReportShortage={handleReportShortage}
      />
    </div>
  );
}
