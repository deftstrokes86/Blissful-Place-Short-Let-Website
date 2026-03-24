import type { AdminWorkerTask } from "@/lib/admin-inventory-api";

export type WorkerTaskDisplayStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "blocked"
  | "escalated"
  | "cancelled";

export function normalizeWorkerTaskStatus(status: AdminWorkerTask["status"]): WorkerTaskDisplayStatus {
  if (status === "open") {
    return "pending";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  return status;
}

export function formatWorkerTaskStatus(status: AdminWorkerTask["status"]): string {
  const normalized = normalizeWorkerTaskStatus(status);

  if (normalized === "in_progress") {
    return "In Progress";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatWorkerTaskType(type: AdminWorkerTask["taskType"]): string {
  if (type === "readiness") {
    return "Cleaning Task";
  }

  if (type === "restock") {
    return "Restock Task";
  }

  if (type === "maintenance") {
    return "Maintenance Task";
  }

  return "Issue Inspection Task";
}

export function formatWorkerTaskUrgency(priority: AdminWorkerTask["priority"]): string {
  if (priority === "critical") {
    return "High";
  }

  if (priority === "important") {
    return "Medium";
  }

  return "Low";
}

export function isActionableWorkerTaskStatus(status: AdminWorkerTask["status"]): boolean {
  const normalized = normalizeWorkerTaskStatus(status);
  return normalized === "pending" || normalized === "in_progress" || normalized === "blocked" || normalized === "escalated";
}

export function getPrimaryTaskAction(status: AdminWorkerTask["status"]): {
  label: string;
  nextStatus: AdminWorkerTask["status"];
} | null {
  const normalized = normalizeWorkerTaskStatus(status);

  if (normalized === "pending") {
    return {
      label: "Start Task",
      nextStatus: "in_progress",
    };
  }

  if (normalized === "in_progress") {
    return {
      label: "Mark Completed",
      nextStatus: "completed",
    };
  }

  if (normalized === "blocked") {
    return {
      label: "Escalate",
      nextStatus: "escalated",
    };
  }

  return null;
}

export function getTaskVisibilityLabel(task: AdminWorkerTask): "Worker Facing" | "Team Facing" {
  const normalizedStatus = normalizeWorkerTaskStatus(task.status);
  if (normalizedStatus === "blocked" || normalizedStatus === "escalated" || task.taskType === "maintenance") {
    return "Team Facing";
  }

  return "Worker Facing";
}
