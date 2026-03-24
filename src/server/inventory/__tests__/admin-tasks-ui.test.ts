import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminTasksSnapshotView } from "../../../components/admin/tasks/AdminTasksSnapshotView";
import type { AdminWorkerTask } from "../../../lib/admin-inventory-api";

function createTasks(): AdminWorkerTask[] {
  return [
    {
      id: "task_1",
      flatId: "mayfair",
      title: "Restock bottled water",
      description: "Top up minibar consumables.",
      taskType: "restock",
      priority: "critical",
      status: "pending",
      sourceType: "alert",
      sourceId: "alert_1",
      assignedTo: "staff_a",
      createdAt: "2026-11-25T08:00:00.000Z",
      updatedAt: "2026-11-25T08:00:00.000Z",
      completedAt: null,
    },
    {
      id: "task_2",
      flatId: "windsor",
      title: "Fix AC leak",
      description: "Technician inspection required.",
      taskType: "maintenance",
      priority: "important",
      status: "blocked",
      sourceType: "maintenance_issue",
      sourceId: "issue_1",
      assignedTo: null,
      createdAt: "2026-11-25T08:10:00.000Z",
      updatedAt: "2026-11-25T08:10:00.000Z",
      completedAt: null,
    },
    {
      id: "task_3",
      flatId: "kensington",
      title: "Readiness follow-up",
      description: "Confirm guest-facing setup complete.",
      taskType: "readiness",
      priority: "important",
      status: "escalated",
      sourceType: "manual",
      sourceId: "manual_1",
      assignedTo: null,
      createdAt: "2026-11-25T08:20:00.000Z",
      updatedAt: "2026-11-25T08:20:00.000Z",
      completedAt: null,
    },
  ];
}

async function testAdminTaskQueueRendersOperationalFieldsAndActions(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminTasksSnapshotView({
      tasks: createTasks(),
      isSubmitting: false,
      onQuickStatusUpdate: async () => undefined,
    })
  );

  assert.ok(html.includes("Operational Task Queue"));
  assert.ok(html.includes("Flat"));
  assert.ok(html.includes("Task Type"));
  assert.ok(html.includes("Urgency"));
  assert.ok(html.includes("Status"));
  assert.ok(html.includes("Visibility"));

  assert.ok(html.includes("Worker Facing"));
  assert.ok(html.includes("Team Facing"));
  assert.ok(html.includes("Pending"));
  assert.ok(html.includes("Blocked"));
  assert.ok(html.includes("Escalated"));

  assert.ok(html.includes("Set In Progress"));
  assert.ok(html.includes("Set Completed"));
  assert.ok(html.includes("Set Blocked"));
}

async function testAdminTaskQueueEmptyState(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminTasksSnapshotView({
      tasks: [],
      isSubmitting: false,
      onQuickStatusUpdate: async () => undefined,
    })
  );

  assert.ok(html.includes("No tasks available for this flat."));
}

async function run(): Promise<void> {
  await testAdminTaskQueueRendersOperationalFieldsAndActions();
  await testAdminTaskQueueEmptyState();

  console.log("admin-tasks-ui: ok");
}

void run();
