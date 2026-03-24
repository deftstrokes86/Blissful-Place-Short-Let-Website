import type { FlatId } from "../../types/booking";
import type { WorkerTaskRecord } from "../../types/booking-backend";
import type {
  CreateManualWorkerTaskInput,
  UpdateWorkerTaskStatusInput,
  WorkerTaskService,
} from "./worker-task-service";

const FLAT_IDS: readonly FlatId[] = ["windsor", "kensington", "mayfair"];
const TASK_STATUSES: readonly WorkerTaskRecord["status"][] = [
  "pending",
  "in_progress",
  "completed",
  "blocked",
  "escalated",
  "open",
  "cancelled",
];
const TASK_TYPES: readonly WorkerTaskRecord["taskType"][] = [
  "restock",
  "maintenance",
  "readiness",
  "inspection",
];
const TASK_PRIORITIES: readonly WorkerTaskRecord["priority"][] = ["critical", "important", "minor"];

function normalizeRequiredString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  return normalizeRequiredString(value) ?? null;
}

function normalizeFlatId(value: string | null | undefined): FlatId | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return FLAT_IDS.includes(normalized as FlatId) ? (normalized as FlatId) : null;
}

function normalizeTaskStatus(value: string | null | undefined): WorkerTaskRecord["status"] | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return TASK_STATUSES.includes(normalized as WorkerTaskRecord["status"])
    ? (normalized as WorkerTaskRecord["status"])
    : null;
}

function normalizeTaskType(value: string | null | undefined): WorkerTaskRecord["taskType"] | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return TASK_TYPES.includes(normalized as WorkerTaskRecord["taskType"])
    ? (normalized as WorkerTaskRecord["taskType"])
    : null;
}

function normalizeTaskPriority(value: string | null | undefined): WorkerTaskRecord["priority"] | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return TASK_PRIORITIES.includes(normalized as WorkerTaskRecord["priority"])
    ? (normalized as WorkerTaskRecord["priority"])
    : null;
}

function normalizeBoolean(value: string | null | undefined): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export async function handleListWorkerTasksRequest(
  service: WorkerTaskService,
  input?: {
    flatId?: string | null;
    status?: string | null;
    sync?: string | null;
    openOnly?: string | null;
  }
) {
  const flatId = normalizeFlatId(input?.flatId ?? null);
  const status = normalizeTaskStatus(input?.status ?? null);
  const shouldSync = normalizeBoolean(input?.sync ?? null);
  const openOnly = normalizeBoolean(input?.openOnly ?? null);

  if (input?.flatId && !flatId) {
    throw new Error("A valid flatId is required.");
  }

  if (input?.status && !status) {
    throw new Error("A valid task status is required.");
  }

  if (shouldSync) {
    if (flatId) {
      await service.syncSystemTasksForFlat(flatId);
    } else {
      for (const id of FLAT_IDS) {
        await service.syncSystemTasksForFlat(id);
      }
    }
  }

  const tasks = await service.listTasks({
    flatId: flatId ?? undefined,
    status: status ?? undefined,
    openOnly,
  });

  return { tasks };
}

export async function handleCreateWorkerTaskRequest(
  service: WorkerTaskService,
  input: {
    flatId: string | null;
    title: string | null;
    description: string | null;
    taskType: string | null;
    priority: string | null;
    assignedTo: string | null;
  }
) {
  const normalized: CreateManualWorkerTaskInput = {
    flatId: normalizeFlatId(input.flatId) as FlatId,
    title: normalizeRequiredString(input.title) ?? "",
    description: normalizeOptionalString(input.description),
    taskType: normalizeTaskType(input.taskType) as WorkerTaskRecord["taskType"],
    priority: normalizeTaskPriority(input.priority) as WorkerTaskRecord["priority"],
    assignedTo: normalizeOptionalString(input.assignedTo),
  };

  if (!normalized.flatId || !normalized.title || !normalized.taskType || !normalized.priority) {
    throw new Error("flatId, title, taskType, and priority are required for task creation.");
  }

  const task = await service.createManualTask(normalized);
  return { task };
}

export async function handleUpdateWorkerTaskStatusRequest(
  service: WorkerTaskService,
  input: {
    taskId: string | null;
    status: string | null;
    assignedTo: string | null;
  }
) {
  const normalized: UpdateWorkerTaskStatusInput = {
    taskId: normalizeRequiredString(input.taskId) ?? "",
    status: normalizeTaskStatus(input.status) as WorkerTaskRecord["status"],
    assignedTo: normalizeOptionalString(input.assignedTo),
  };

  if (!normalized.taskId || !normalized.status) {
    throw new Error("taskId and status are required for task status updates.");
  }

  const task = await service.updateTaskStatus(normalized);
  return { task };
}
