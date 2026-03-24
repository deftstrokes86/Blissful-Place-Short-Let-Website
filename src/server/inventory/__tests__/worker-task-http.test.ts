import assert from "node:assert/strict";

import {
  handleCreateWorkerTaskRequest,
  handleListWorkerTasksRequest,
  handleUpdateWorkerTaskStatusRequest,
} from "../worker-task-http";
import type { WorkerTaskService } from "../worker-task-service";
import type { WorkerTaskRecord } from "../../../types/booking-backend";

class StubWorkerTaskService implements Pick<
  WorkerTaskService,
  "syncSystemTasksForFlat" | "listTasks" | "createManualTask" | "updateTaskStatus"
> {
  syncCalls: Array<"windsor" | "kensington" | "mayfair"> = [];

  async syncSystemTasksForFlat(flatId: "windsor" | "kensington" | "mayfair") {
    this.syncCalls.push(flatId);

    return {
      created: [],
      reopened: [],
      autoCompleted: [],
      openTasks: [],
    };
  }

  async listTasks(): Promise<WorkerTaskRecord[]> {
    return [
      {
        id: "worker_task_1",
        flatId: "mayfair",
        title: "Restock tissue",
        description: "Low stock",
        taskType: "restock",
        priority: "important",
        status: "pending",
        sourceType: "alert",
        sourceId: "alert_1",
        assignedTo: null,
        createdAt: "2026-11-16T09:00:00.000Z",
        updatedAt: "2026-11-16T09:00:00.000Z",
        completedAt: null,
      },
    ];
  }

  async createManualTask(input: {
    flatId: "windsor" | "kensington" | "mayfair";
    title: string;
    description?: string | null;
    taskType: "restock" | "maintenance" | "readiness" | "inspection";
    priority: "critical" | "important" | "minor";
    assignedTo?: string | null;
  }): Promise<WorkerTaskRecord> {
    return {
      id: "worker_task_created",
      flatId: input.flatId,
      title: input.title,
      description: input.description ?? null,
      taskType: input.taskType,
      priority: input.priority,
      status: "pending",
      sourceType: "manual",
      sourceId: "manual_1",
      assignedTo: input.assignedTo ?? null,
      createdAt: "2026-11-16T09:00:00.000Z",
      updatedAt: "2026-11-16T09:00:00.000Z",
      completedAt: null,
    };
  }

  async updateTaskStatus(input: {
    taskId: string;
    status: "pending" | "in_progress" | "completed" | "blocked" | "escalated";
    assignedTo?: string | null;
  }): Promise<WorkerTaskRecord> {
    return {
      id: input.taskId,
      flatId: "mayfair",
      title: "Restock tissue",
      description: "Low stock",
      taskType: "restock",
      priority: "important",
      status: input.status,
      sourceType: "alert",
      sourceId: "alert_1",
      assignedTo: input.assignedTo ?? null,
      createdAt: "2026-11-16T09:00:00.000Z",
      updatedAt: "2026-11-16T09:05:00.000Z",
      completedAt: input.status === "completed" ? "2026-11-16T09:05:00.000Z" : null,
    };
  }
}

async function testListTasksValidationAndSync(): Promise<void> {
  const service = new StubWorkerTaskService();

  await assert.rejects(
    async () => {
      await handleListWorkerTasksRequest(service as unknown as WorkerTaskService, {
        flatId: "invalid",
        sync: "true",
      });
    },
    /valid flatId/i
  );

  const result = await handleListWorkerTasksRequest(service as unknown as WorkerTaskService, {
    flatId: "mayfair",
    sync: "true",
    openOnly: "true",
  });

  assert.equal(service.syncCalls.length, 1);
  assert.equal(result.tasks.length, 1);
}

async function testCreateTaskValidationAndShape(): Promise<void> {
  const service = new StubWorkerTaskService();

  await assert.rejects(
    async () => {
      await handleCreateWorkerTaskRequest(service as unknown as WorkerTaskService, {
        flatId: "mayfair",
        title: null,
        description: null,
        taskType: "restock",
        priority: "important",
        assignedTo: null,
      });
    },
    /required/i
  );

  const result = await handleCreateWorkerTaskRequest(service as unknown as WorkerTaskService, {
    flatId: "mayfair",
    title: "Restock water",
    description: "Urgent",
    taskType: "restock",
    priority: "important",
    assignedTo: "staff_ops_1",
  });

  assert.equal(result.task.sourceType, "manual");
  assert.equal(result.task.title, "Restock water");
}

async function testUpdateTaskValidationAndShape(): Promise<void> {
  const service = new StubWorkerTaskService();

  await assert.rejects(
    async () => {
      await handleUpdateWorkerTaskStatusRequest(service as unknown as WorkerTaskService, {
        taskId: "task_1",
        status: "bad_status",
        assignedTo: null,
      });
    },
    /required/i
  );

  const result = await handleUpdateWorkerTaskStatusRequest(service as unknown as WorkerTaskService, {
    taskId: "task_1",
    status: "completed",
    assignedTo: "staff_ops_2",
  });

  assert.equal(result.task.status, "completed");
  assert.equal(result.task.assignedTo, "staff_ops_2");

  const blocked = await handleUpdateWorkerTaskStatusRequest(service as unknown as WorkerTaskService, {
    taskId: "task_2",
    status: "blocked",
    assignedTo: null,
  });

  assert.equal(blocked.task.status, "blocked");
}

async function run(): Promise<void> {
  await testListTasksValidationAndSync();
  await testCreateTaskValidationAndShape();
  await testUpdateTaskValidationAndShape();

  console.log("worker-task-http: ok");
}

void run();
