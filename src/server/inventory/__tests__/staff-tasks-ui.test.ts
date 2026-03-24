import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { StaffTasksSnapshotView } from "../../../components/staff/StaffTasksSnapshotView";
import type { AdminWorkerTask } from "../../../lib/admin-inventory-api";

function createTasks(): AdminWorkerTask[] {
  return [
    {
      id: "task_cleaning_1",
      flatId: "mayfair",
      title: "Prepare flat for next guest",
      description: "Do final cleaning checks and confirm bathroom reset.",
      taskType: "readiness",
      priority: "important",
      status: "pending",
      sourceType: "readiness",
      sourceId: "readiness:mayfair:needs_attention",
      assignedTo: null,
      createdAt: "2026-11-25T08:00:00.000Z",
      updatedAt: "2026-11-25T08:00:00.000Z",
      completedAt: null,
    },
    {
      id: "task_restock_1",
      flatId: "mayfair",
      title: "Restock bottled water",
      description: "Refill minibar water to expected quantity.",
      taskType: "restock",
      priority: "critical",
      status: "in_progress",
      sourceType: "alert",
      sourceId: "alert_1",
      assignedTo: null,
      createdAt: "2026-11-25T08:10:00.000Z",
      updatedAt: "2026-11-25T08:10:00.000Z",
      completedAt: null,
    },
    {
      id: "task_maintenance_1",
      flatId: "windsor",
      title: "Fix shower pressure",
      description: "Inspect and repair shower valve issue.",
      taskType: "maintenance",
      priority: "important",
      status: "blocked",
      sourceType: "maintenance_issue",
      sourceId: "issue_1",
      assignedTo: null,
      createdAt: "2026-11-25T08:20:00.000Z",
      updatedAt: "2026-11-25T08:20:00.000Z",
      completedAt: null,
    },
    {
      id: "task_inspection_1",
      flatId: "kensington",
      title: "Inspect guest complaint",
      description: "Verify TV remote battery state.",
      taskType: "inspection",
      priority: "minor",
      status: "escalated",
      sourceType: "manual",
      sourceId: "manual_1",
      assignedTo: null,
      createdAt: "2026-11-25T08:30:00.000Z",
      updatedAt: "2026-11-25T08:30:00.000Z",
      completedAt: null,
    },
  ];
}

async function testStaffTaskCardsRenderTaskContextAndPrimaryActions(): Promise<void> {
  const html = renderToStaticMarkup(
    StaffTasksSnapshotView({
      tasks: createTasks(),
      selectedFlatName: "Mayfair Suite",
      isSubmittingTaskId: null,
      onRunPrimaryAction: async () => undefined,
      onMarkBlocked: async () => undefined,
    })
  );

  assert.ok(html.includes("Task List"));
  assert.ok(html.includes("Mayfair Suite"));
  assert.ok(html.includes("Flat"));
  assert.ok(html.includes("Task Type"));
  assert.ok(html.includes("Urgency"));
  assert.ok(html.includes("Instruction"));

  assert.ok(html.includes("Cleaning Task"));
  assert.ok(html.includes("Restock Task"));
  assert.ok(html.includes("Maintenance Task"));
  assert.ok(html.includes("Issue Inspection Task"));

  assert.ok(html.includes("Start Task"));
  assert.ok(html.includes("Mark Completed"));
  assert.ok(html.includes("Cannot Complete"));
}

async function testStaffTaskStatusesAndEmptyState(): Promise<void> {
  const statusHtml = renderToStaticMarkup(
    StaffTasksSnapshotView({
      tasks: createTasks(),
      selectedFlatName: "Mayfair Suite",
      isSubmittingTaskId: null,
      onRunPrimaryAction: async () => undefined,
      onMarkBlocked: async () => undefined,
    })
  );

  assert.ok(statusHtml.includes("Pending"));
  assert.ok(statusHtml.includes("In Progress"));
  assert.ok(statusHtml.includes("Blocked"));
  assert.ok(statusHtml.includes("Escalated"));

  const emptyHtml = renderToStaticMarkup(
    StaffTasksSnapshotView({
      tasks: [],
      selectedFlatName: "Mayfair Suite",
      isSubmittingTaskId: null,
      onRunPrimaryAction: async () => undefined,
      onMarkBlocked: async () => undefined,
    })
  );

  assert.ok(emptyHtml.includes("No tasks in your queue right now."));
}

async function run(): Promise<void> {
  await testStaffTaskCardsRenderTaskContextAndPrimaryActions();
  await testStaffTaskStatusesAndEmptyState();

  console.log("staff-tasks-ui: ok");
}

void run();
