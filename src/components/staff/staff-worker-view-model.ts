import type { AdminFlatInventoryEntry, AdminWorkerTask } from "@/lib/admin-inventory-api";
import { isActionableWorkerTaskStatus } from "../tasks/worker-task-view-model";
import type { FlatId } from "@/types/booking";

export type StaffIssueType =
  | "cleaning_problem"
  | "linen_problem"
  | "supplies_missing"
  | "equipment_damage"
  | "plumbing"
  | "electrical"
  | "other";

export interface StaffIssueTypeOption {
  id: StaffIssueType;
  label: string;
}

export interface RestockEntry {
  flatId: FlatId;
  flatName: string;
  recordId: string;
  itemName: string;
  currentQuantity: number;
  expectedQuantity: number;
  neededQuantity: number;
  note: string;
}

export interface FlatChecklistDraft {
  cleaning: boolean;
  linen: boolean;
  consumables: boolean;
}

export const STAFF_ISSUE_TYPE_OPTIONS: StaffIssueTypeOption[] = [
  { id: "supplies_missing", label: "Supplies Missing" },
  { id: "equipment_damage", label: "Equipment Damage" },
  { id: "cleaning_problem", label: "Cleaning Problem" },
  { id: "linen_problem", label: "Linen Problem" },
  { id: "plumbing", label: "Plumbing" },
  { id: "electrical", label: "Electrical" },
  { id: "other", label: "Other" },
];

export function buildIssueTitle(issueType: StaffIssueType): string {
  const found = STAFF_ISSUE_TYPE_OPTIONS.find((option) => option.id === issueType);
  return found ? found.label : "Other";
}

export function parseNonNegativeInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function isRestockCandidate(record: AdminFlatInventoryEntry): boolean {
  if (record.category !== "consumable" && record.category !== "maintenance_supply") {
    return false;
  }

  if (record.conditionStatus === "missing" || record.conditionStatus === "damaged" || record.conditionStatus === "needs_replacement") {
    return true;
  }

  return record.currentQuantity < record.expectedQuantity;
}

export function buildRestockEntries(
  records: AdminFlatInventoryEntry[],
  flatId: FlatId,
  flatName: string
): RestockEntry[] {
  return records
    .filter(isRestockCandidate)
    .map((record) => {
      const neededQuantity = Math.max(0, record.expectedQuantity - record.currentQuantity);

      return {
        flatId,
        flatName,
        recordId: record.id,
        itemName: record.itemName,
        currentQuantity: record.currentQuantity,
        expectedQuantity: record.expectedQuantity,
        neededQuantity,
        note: record.notes ?? "",
      };
    });
}

export function findPreferredTaskForFlat(
  tasks: AdminWorkerTask[],
  flatId: FlatId,
  preferredTypes: AdminWorkerTask["taskType"][]
): AdminWorkerTask | null {
  for (const type of preferredTypes) {
    const found = tasks.find((task) => task.flatId === flatId && task.taskType === type && isActionableWorkerTaskStatus(task.status));
    if (found) {
      return found;
    }
  }

  const fallback = tasks.find((task) => task.flatId === flatId && isActionableWorkerTaskStatus(task.status));
  return fallback ?? null;
}

export function isChecklistComplete(draft: FlatChecklistDraft): boolean {
  return draft.cleaning && draft.linen && draft.consumables;
}

export function formatReadinessPill(readinessStatus: "ready" | "needs_attention" | "out_of_service" | null): string {
  if (!readinessStatus) {
    return "Pending";
  }

  if (readinessStatus === "needs_attention") {
    return "Needs Attention";
  }

  if (readinessStatus === "out_of_service") {
    return "Out Of Service";
  }

  return "Ready";
}
