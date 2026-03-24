import { randomUUID } from "node:crypto";

import type { FlatId } from "../../types/booking";
import type {
  FlatReadinessRecord,
  FlatRecord,
  InventoryAlertRecord,
  MaintenanceIssueRecord,
  WorkerTaskPriority,
  WorkerTaskRecord,
  WorkerTaskStatus,
  WorkerTaskType,
} from "../../types/booking-backend";

type WorkerTaskIdPrefix = "worker_task";

interface WorkerTaskServiceDependencies {
  repository: WorkerTaskRepository;
  now?: () => Date;
  createId?: (prefix: WorkerTaskIdPrefix) => string;
}

export interface WorkerTaskRepository {
  findFlatById(flatId: FlatId): Promise<FlatRecord | null>;
  findReadinessByFlatId(flatId: FlatId): Promise<FlatReadinessRecord | null>;
  listActiveAlerts(flatId: FlatId): Promise<InventoryAlertRecord[]>;
  listActiveMaintenanceIssues(flatId: FlatId): Promise<MaintenanceIssueRecord[]>;
  listTasks(filter?: { flatId?: FlatId; status?: WorkerTaskStatus }): Promise<WorkerTaskRecord[]>;
  findTaskById(taskId: string): Promise<WorkerTaskRecord | null>;
  findTaskBySource(sourceType: WorkerTaskRecord["sourceType"], sourceId: string): Promise<WorkerTaskRecord | null>;
  createTask(task: WorkerTaskRecord): Promise<WorkerTaskRecord>;
  updateTask(task: WorkerTaskRecord): Promise<WorkerTaskRecord>;
}

export interface SyncWorkerTasksResult {
  created: WorkerTaskRecord[];
  reopened: WorkerTaskRecord[];
  autoCompleted: WorkerTaskRecord[];
  openTasks: WorkerTaskRecord[];
}

export interface CreateManualWorkerTaskInput {
  flatId: FlatId;
  title: string;
  description?: string | null;
  taskType: WorkerTaskType;
  priority: WorkerTaskPriority;
  assignedTo?: string | null;
}

export interface UpdateWorkerTaskStatusInput {
  taskId: string;
  status: WorkerTaskStatus;
  assignedTo?: string | null;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredString(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function mapAlertToTask(alert: InventoryAlertRecord): {
  taskType: WorkerTaskType;
  priority: WorkerTaskPriority;
  title: string;
  description: string;
} {
  if (alert.alertType === "low_stock" || alert.alertType === "missing_required_item") {
    return {
      taskType: "restock",
      priority: alert.severity,
      title: "Restock required inventory",
      description: alert.message,
    };
  }

  if (alert.alertType === "damaged_critical_asset") {
    return {
      taskType: "maintenance",
      priority: "critical",
      title: "Fix or replace critical asset",
      description: alert.message,
    };
  }

  return {
    taskType: "readiness",
    priority: alert.severity,
    title: "Investigate readiness alert",
    description: alert.message,
  };
}

function mapIssueToTask(issue: MaintenanceIssueRecord): {
  taskType: WorkerTaskType;
  priority: WorkerTaskPriority;
  title: string;
  description: string | null;
} {
  return {
    taskType: "maintenance",
    priority: issue.severity,
    title: `Resolve maintenance issue: ${issue.title}`,
    description: issue.notes,
  };
}

function mapReadinessToTask(readiness: FlatReadinessRecord): {
  sourceId: string;
  taskType: WorkerTaskType;
  priority: WorkerTaskPriority;
  title: string;
  description: string;
} | null {
  if (readiness.readinessStatus === "ready") {
    return null;
  }

  if (readiness.readinessStatus === "out_of_service") {
    return {
      sourceId: `readiness:${readiness.flatId}:out_of_service`,
      taskType: "readiness",
      priority: "critical",
      title: "Readiness out of service: immediate ops action",
      description: "Flat requires immediate operational review and block coordination.",
    };
  }

  return {
    sourceId: `readiness:${readiness.flatId}:needs_attention`,
    taskType: "readiness",
    priority: "important",
    title: "Readiness needs attention",
    description: "Flat has readiness issues that should be resolved before next turnover.",
  };
}

function toPriorityRank(priority: WorkerTaskPriority): number {
  if (priority === "critical") {
    return 0;
  }

  if (priority === "important") {
    return 1;
  }

  return 2;
}

function isActionableStatus(status: WorkerTaskStatus): boolean {
  return (
    status === "pending" ||
    status === "in_progress" ||
    status === "blocked" ||
    status === "escalated" ||
    status === "open"
  );
}

interface DesiredSignalTask {
  sourceType: WorkerTaskRecord["sourceType"];
  sourceId: string;
  taskType: WorkerTaskType;
  priority: WorkerTaskPriority;
  title: string;
  description: string | null;
}

export class WorkerTaskService {
  private readonly repository: WorkerTaskRepository;
  private readonly nowProvider: () => Date;
  private readonly createId: (prefix: WorkerTaskIdPrefix) => string;

  constructor(dependencies: WorkerTaskServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
  }

  async syncSystemTasksForFlat(flatId: FlatId): Promise<SyncWorkerTasksResult> {
    const flat = await this.repository.findFlatById(flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    const [readiness, alerts, issues, existing] = await Promise.all([
      this.repository.findReadinessByFlatId(flat.id),
      this.repository.listActiveAlerts(flat.id),
      this.repository.listActiveMaintenanceIssues(flat.id),
      this.repository.listTasks({ flatId: flat.id }),
    ]);

    const nowIso = this.nowProvider().toISOString();

    const desiredSignals: DesiredSignalTask[] = [];

    for (const alert of alerts) {
      const mapped = mapAlertToTask(alert);
      desiredSignals.push({
        sourceType: "alert",
        sourceId: alert.id,
        taskType: mapped.taskType,
        priority: mapped.priority,
        title: mapped.title,
        description: mapped.description,
      });
    }

    for (const issue of issues) {
      const mapped = mapIssueToTask(issue);
      desiredSignals.push({
        sourceType: "maintenance_issue",
        sourceId: issue.id,
        taskType: mapped.taskType,
        priority: mapped.priority,
        title: mapped.title,
        description: mapped.description,
      });
    }

    if (readiness) {
      const mapped = mapReadinessToTask(readiness);
      if (mapped) {
        desiredSignals.push({
          sourceType: "readiness",
          sourceId: mapped.sourceId,
          taskType: mapped.taskType,
          priority: mapped.priority,
          title: mapped.title,
          description: mapped.description,
        });
      }
    }

    const desiredKeySet = new Set<string>();
    const created: WorkerTaskRecord[] = [];
    const reopened: WorkerTaskRecord[] = [];
    const autoCompleted: WorkerTaskRecord[] = [];

    for (const desired of desiredSignals) {
      const key = `${desired.sourceType}:${desired.sourceId}`;
      if (desiredKeySet.has(key)) {
        continue;
      }

      desiredKeySet.add(key);
      const existingBySource = await this.repository.findTaskBySource(desired.sourceType, desired.sourceId);

      if (!existingBySource) {
        const createdTask: WorkerTaskRecord = {
          id: this.createId("worker_task"),
          flatId: flat.id,
          title: desired.title,
          description: desired.description,
          taskType: desired.taskType,
          priority: desired.priority,
          status: "pending",
          sourceType: desired.sourceType,
          sourceId: desired.sourceId,
          assignedTo: null,
          createdAt: nowIso,
          updatedAt: nowIso,
          completedAt: null,
        };

        created.push(await this.repository.createTask(createdTask));
        continue;
      }

      const shouldReopen = existingBySource.status === "completed" || existingBySource.status === "cancelled";
      if (shouldReopen) {
        const reopenedTask: WorkerTaskRecord = {
          ...existingBySource,
          title: desired.title,
          description: desired.description,
          taskType: desired.taskType,
          priority: desired.priority,
          status: "pending",
          completedAt: null,
          updatedAt: nowIso,
        };

        reopened.push(await this.repository.updateTask(reopenedTask));
      }
    }

    for (const task of existing) {
      if (task.sourceType === "manual") {
        continue;
      }

      if (!isActionableStatus(task.status)) {
        continue;
      }

      const key = `${task.sourceType}:${task.sourceId}`;
      if (desiredKeySet.has(key)) {
        continue;
      }

      const completedTask: WorkerTaskRecord = {
        ...task,
        status: "completed",
        completedAt: nowIso,
        updatedAt: nowIso,
      };

      autoCompleted.push(await this.repository.updateTask(completedTask));
    }

    const openTasks = await this.listTasks({ flatId: flat.id, openOnly: true });

    return {
      created,
      reopened,
      autoCompleted,
      openTasks,
    };
  }

  async createManualTask(input: CreateManualWorkerTaskInput): Promise<WorkerTaskRecord> {
    const flat = await this.repository.findFlatById(input.flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    const nowIso = this.nowProvider().toISOString();

    const task: WorkerTaskRecord = {
      id: this.createId("worker_task"),
      flatId: flat.id,
      title: normalizeRequiredString(input.title, "title"),
      description: normalizeOptionalString(input.description),
      taskType: input.taskType,
      priority: input.priority,
      status: "pending",
      sourceType: "manual",
      sourceId: this.createId("worker_task"),
      assignedTo: normalizeOptionalString(input.assignedTo),
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: null,
    };

    return this.repository.createTask(task);
  }

  async updateTaskStatus(input: UpdateWorkerTaskStatusInput): Promise<WorkerTaskRecord> {
    const task = await this.repository.findTaskById(input.taskId);
    if (!task) {
      throw new Error("Worker task not found.");
    }

    const nowIso = this.nowProvider().toISOString();
    const nextAssigned = input.assignedTo === undefined ? task.assignedTo : normalizeOptionalString(input.assignedTo);
    const nextCompletedAt = input.status === "completed" ? nowIso : null;

    const updated: WorkerTaskRecord = {
      ...task,
      status: input.status,
      assignedTo: nextAssigned,
      completedAt: nextCompletedAt,
      updatedAt: nowIso,
    };

    return this.repository.updateTask(updated);
  }

  async listTasks(filter?: {
    flatId?: FlatId;
    status?: WorkerTaskStatus;
    openOnly?: boolean;
  }): Promise<WorkerTaskRecord[]> {
    const tasks = await this.repository.listTasks({
      flatId: filter?.flatId,
      status: filter?.status,
    });

    const filtered = filter?.openOnly ? tasks.filter((task) => isActionableStatus(task.status)) : tasks;

    return [...filtered].sort((left, right) => {
      const priorityDiff = toPriorityRank(left.priority) - toPriorityRank(right.priority);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });
  }
}
