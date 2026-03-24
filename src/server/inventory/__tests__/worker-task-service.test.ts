import assert from "node:assert/strict";

import { WorkerTaskService, type WorkerTaskRepository } from "../worker-task-service";
import type {
  FlatReadinessRecord,
  FlatRecord,
  InventoryAlertRecord,
  MaintenanceIssueRecord,
  WorkerTaskRecord,
} from "../../../types/booking-backend";
import type { FlatId } from "../../../types/booking";

class InMemoryWorkerTaskRepository implements WorkerTaskRepository {
  private readonly flats = new Map<FlatId, FlatRecord>();
  private readonly readinessByFlat = new Map<FlatId, FlatReadinessRecord>();
  private readonly alerts: InventoryAlertRecord[] = [];
  private readonly issues: MaintenanceIssueRecord[] = [];
  private readonly tasks = new Map<string, WorkerTaskRecord>();

  constructor(args: {
    flats: FlatRecord[];
    readinessByFlat?: FlatReadinessRecord[];
    alerts?: InventoryAlertRecord[];
    issues?: MaintenanceIssueRecord[];
    tasks?: WorkerTaskRecord[];
  }) {
    for (const flat of args.flats) {
      this.flats.set(flat.id, { ...flat });
    }

    for (const record of args.readinessByFlat ?? []) {
      this.readinessByFlat.set(record.flatId, { ...record });
    }

    for (const alert of args.alerts ?? []) {
      this.alerts.push({ ...alert });
    }

    for (const issue of args.issues ?? []) {
      this.issues.push({ ...issue });
    }

    for (const task of args.tasks ?? []) {
      this.tasks.set(task.id, { ...task });
    }
  }

  async findFlatById(flatId: FlatId): Promise<FlatRecord | null> {
    return this.flats.get(flatId) ?? null;
  }

  async findReadinessByFlatId(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    return this.readinessByFlat.get(flatId) ?? null;
  }

  async listActiveAlerts(flatId: FlatId): Promise<InventoryAlertRecord[]> {
    return this.alerts.filter((alert) => alert.flatId === flatId && alert.status !== "resolved").map((entry) => ({ ...entry }));
  }

  async listActiveMaintenanceIssues(flatId: FlatId): Promise<MaintenanceIssueRecord[]> {
    return this.issues
      .filter((issue) => issue.flatId === flatId && (issue.status === "open" || issue.status === "in_progress"))
      .map((entry) => ({ ...entry }));
  }

  async listTasks(filter?: { flatId?: FlatId; status?: WorkerTaskRecord["status"] }): Promise<WorkerTaskRecord[]> {
    const values = Array.from(this.tasks.values());
    return values
      .filter((task) => {
        if (filter?.flatId && task.flatId !== filter.flatId) {
          return false;
        }

        if (filter?.status && task.status !== filter.status) {
          return false;
        }

        return true;
      })
      .map((entry) => ({ ...entry }));
  }

  async findTaskById(taskId: string): Promise<WorkerTaskRecord | null> {
    const found = this.tasks.get(taskId);
    return found ? { ...found } : null;
  }

  async findTaskBySource(sourceType: WorkerTaskRecord["sourceType"], sourceId: string): Promise<WorkerTaskRecord | null> {
    for (const task of this.tasks.values()) {
      if (task.sourceType === sourceType && task.sourceId === sourceId) {
        return { ...task };
      }
    }

    return null;
  }

  async createTask(task: WorkerTaskRecord): Promise<WorkerTaskRecord> {
    this.tasks.set(task.id, { ...task });
    return { ...task };
  }

  async updateTask(task: WorkerTaskRecord): Promise<WorkerTaskRecord> {
    this.tasks.set(task.id, { ...task });
    return { ...task };
  }
}

function createFlat(now: string): FlatRecord {
  return {
    id: "mayfair",
    name: "Mayfair Suite",
    nightlyRate: 250000,
    maxGuests: 6,
    createdAt: now,
    updatedAt: now,
  };
}

function createHarness(args?: {
  readiness?: FlatReadinessRecord;
  alerts?: InventoryAlertRecord[];
  issues?: MaintenanceIssueRecord[];
  tasks?: WorkerTaskRecord[];
}) {
  const now = "2026-11-15T09:00:00.000Z";

  const repository = new InMemoryWorkerTaskRepository({
    flats: [createFlat(now)],
    readinessByFlat: args?.readiness ? [{ ...args.readiness }] : [],
    alerts: args?.alerts ?? [],
    issues: args?.issues ?? [],
    tasks: args?.tasks ?? [],
  });

  let sequence = 0;
  const service = new WorkerTaskService({
    repository,
    now: () => new Date("2026-11-15T10:00:00.000Z"),
    createId: (prefix) => {
      sequence += 1;
      return `${prefix}_${String(sequence).padStart(3, "0")}`;
    },
  });

  return {
    service,
  };
}

function createReadiness(status: FlatReadinessRecord["readinessStatus"]): FlatReadinessRecord {
  return {
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
    consumablesStatus: status === "ready" ? "ready" : "attention_required",
    maintenanceStatus: status === "out_of_service" ? "blocked" : "ready",
    criticalAssetStatus: status === "out_of_service" ? "blocked" : "ready",
    readinessStatus: status,
    overrideStatus: null,
    overrideReason: null,
    updatedAt: "2026-11-15T09:00:00.000Z",
  };
}

async function testCreatesTasksFromAlertsAndIssuesWithoutDuplicates(): Promise<void> {
  const { service } = createHarness({
    readiness: createReadiness("needs_attention"),
    alerts: [
      {
        id: "alert_low_stock_1",
        inventoryItemId: "item_water",
        flatId: "mayfair",
        alertType: "low_stock",
        severity: "important",
        status: "open",
        message: "Bottled water below expected level.",
        createdAt: "2026-11-15T09:00:00.000Z",
        resolvedAt: null,
      },
    ],
    issues: [
      {
        id: "issue_maintenance_1",
        flatId: "mayfair",
        inventoryItemId: "item_tv",
        title: "TV not powering on",
        notes: "Reported by housekeeping",
        severity: "important",
        status: "open",
        createdAt: "2026-11-15T09:00:00.000Z",
        updatedAt: "2026-11-15T09:00:00.000Z",
        resolvedAt: null,
      },
    ],
  });

  const first = await service.syncSystemTasksForFlat("mayfair");
  assert.equal(first.created.length, 3);
  assert.equal(first.openTasks.length, 3);

  const second = await service.syncSystemTasksForFlat("mayfair");
  assert.equal(second.created.length, 0);
  assert.equal(second.openTasks.length, 3);
}

async function testOutOfServiceCreatesCriticalReadinessTask(): Promise<void> {
  const { service } = createHarness({
    readiness: createReadiness("out_of_service"),
  });

  const result = await service.syncSystemTasksForFlat("mayfair");
  const readinessTask = result.openTasks.find((task) => task.sourceId === "readiness:mayfair:out_of_service");

  assert.ok(readinessTask);
  assert.equal(readinessTask?.priority, "critical");
  assert.equal(readinessTask?.taskType, "readiness");
}

async function testResolvedSignalsAutoCompleteSystemTasks(): Promise<void> {
  const { service } = createHarness({
    readiness: createReadiness("ready"),
    tasks: [
      {
        id: "worker_task_1",
        flatId: "mayfair",
        title: "Restock bottled water",
        description: "Low stock detected",
        taskType: "restock",
        priority: "important",
        status: "pending",
        sourceType: "alert",
        sourceId: "alert_low_stock_1",
        assignedTo: null,
        createdAt: "2026-11-15T08:00:00.000Z",
        updatedAt: "2026-11-15T08:00:00.000Z",
        completedAt: null,
      },
    ],
  });

  const result = await service.syncSystemTasksForFlat("mayfair");
  assert.equal(result.autoCompleted.length, 1);
  assert.equal(result.autoCompleted[0].status, "completed");
}

async function testManualTaskLifecycle(): Promise<void> {
  const { service } = createHarness({
    readiness: createReadiness("ready"),
  });

  const created = await service.createManualTask({
    flatId: "mayfair",
    title: "Replace kitchen bulbs",
    description: "Night shift prep",
    taskType: "maintenance",
    priority: "minor",
    assignedTo: "staff_ops_2",
  });

  assert.equal(created.status, "pending");
  assert.equal(created.sourceType, "manual");

  const progressed = await service.updateTaskStatus({
    taskId: created.id,
    status: "in_progress",
    assignedTo: "staff_ops_3",
  });
  assert.equal(progressed.status, "in_progress");
  assert.equal(progressed.assignedTo, "staff_ops_3");

  const blocked = await service.updateTaskStatus({
    taskId: created.id,
    status: "blocked",
  });
  assert.equal(blocked.status, "blocked");

  const escalated = await service.updateTaskStatus({
    taskId: created.id,
    status: "escalated",
  });
  assert.equal(escalated.status, "escalated");

  const completed = await service.updateTaskStatus({
    taskId: created.id,
    status: "completed",
  });

  assert.equal(completed.status, "completed");
  assert.ok(completed.completedAt);
}

async function testOpenOnlyIncludesBlockedAndEscalated(): Promise<void> {
  const { service } = createHarness({
    readiness: createReadiness("ready"),
    tasks: [
      {
        id: "worker_task_pending",
        flatId: "mayfair",
        title: "Pending task",
        description: null,
        taskType: "inspection",
        priority: "minor",
        status: "pending",
        sourceType: "manual",
        sourceId: "manual_pending",
        assignedTo: null,
        createdAt: "2026-11-15T08:00:00.000Z",
        updatedAt: "2026-11-15T08:00:00.000Z",
        completedAt: null,
      },
      {
        id: "worker_task_blocked",
        flatId: "mayfair",
        title: "Blocked task",
        description: null,
        taskType: "maintenance",
        priority: "important",
        status: "blocked",
        sourceType: "manual",
        sourceId: "manual_blocked",
        assignedTo: null,
        createdAt: "2026-11-15T08:00:00.000Z",
        updatedAt: "2026-11-15T08:00:00.000Z",
        completedAt: null,
      },
      {
        id: "worker_task_escalated",
        flatId: "mayfair",
        title: "Escalated task",
        description: null,
        taskType: "readiness",
        priority: "critical",
        status: "escalated",
        sourceType: "manual",
        sourceId: "manual_escalated",
        assignedTo: null,
        createdAt: "2026-11-15T08:00:00.000Z",
        updatedAt: "2026-11-15T08:00:00.000Z",
        completedAt: null,
      },
      {
        id: "worker_task_completed",
        flatId: "mayfair",
        title: "Done task",
        description: null,
        taskType: "restock",
        priority: "important",
        status: "completed",
        sourceType: "manual",
        sourceId: "manual_completed",
        assignedTo: null,
        createdAt: "2026-11-15T08:00:00.000Z",
        updatedAt: "2026-11-15T08:00:00.000Z",
        completedAt: "2026-11-15T08:05:00.000Z",
      },
    ],
  });

  const openOnly = await service.listTasks({ flatId: "mayfair", openOnly: true });
  assert.equal(openOnly.length, 3);
  assert.deepEqual(
    openOnly.map((task) => task.status).sort(),
    ["blocked", "escalated", "pending"]
  );
}

async function run(): Promise<void> {
  await testCreatesTasksFromAlertsAndIssuesWithoutDuplicates();
  await testOutOfServiceCreatesCriticalReadinessTask();
  await testResolvedSignalsAutoCompleteSystemTasks();
  await testManualTaskLifecycle();
  await testOpenOnlyIncludesBlockedAndEscalated();

  console.log("worker-task-service: ok");
}

void run();
