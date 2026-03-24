import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { StaffFlatExecutionSnapshotView } from "../../../components/staff/StaffFlatExecutionSnapshotView";
import type { AdminWorkerTask } from "../../../lib/admin-inventory-api";

function createTasks(): AdminWorkerTask[] {
  return [
    {
      id: "task_readiness_1",
      flatId: "mayfair",
      title: "Finish flat reset",
      description: "Confirm cleaning and linen checks.",
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
  ];
}

async function testFlatExecutionRendersChecklistAndFailureFlows(): Promise<void> {
  const html = renderToStaticMarkup(
    StaffFlatExecutionSnapshotView({
      flatLabel: "Mayfair Suite",
      readinessStatus: "needs_attention",
      tasks: createTasks(),
      isSubmitting: false,
      checklistDraft: {
        cleaning: true,
        linen: false,
        consumables: true,
      },
      issueNote: "Need replacement towels",
      onChecklistToggle: () => undefined,
      onIssueNoteChange: () => undefined,
      onMarkComplete: async () => undefined,
      onReportProblem: async () => undefined,
      onMarkCannotComplete: async () => undefined,
      onNeedSupplies: async () => undefined,
      onEscalate: async () => undefined,
    })
  );

  assert.ok(html.includes("Cleaning Checklist"));
  assert.ok(html.includes("Linen Checklist"));
  assert.ok(html.includes("Consumables Checklist"));
  assert.ok(html.includes("Mark Complete"));
  assert.ok(html.includes("Report Problem"));
  assert.ok(html.includes("Cannot Complete"));
  assert.ok(html.includes("Need Supplies"));
  assert.ok(html.includes("Escalate"));
  assert.ok(html.includes("Mayfair Suite"));
}

async function testFlatExecutionEmptyTaskState(): Promise<void> {
  const html = renderToStaticMarkup(
    StaffFlatExecutionSnapshotView({
      flatLabel: "Mayfair Suite",
      readinessStatus: "ready",
      tasks: [],
      isSubmitting: false,
      checklistDraft: {
        cleaning: false,
        linen: false,
        consumables: false,
      },
      issueNote: "",
      onChecklistToggle: () => undefined,
      onIssueNoteChange: () => undefined,
      onMarkComplete: async () => undefined,
      onReportProblem: async () => undefined,
      onMarkCannotComplete: async () => undefined,
      onNeedSupplies: async () => undefined,
      onEscalate: async () => undefined,
    })
  );

  assert.ok(html.includes("No active flat tasks right now."));
}

async function run(): Promise<void> {
  await testFlatExecutionRendersChecklistAndFailureFlows();
  await testFlatExecutionEmptyTaskState();

  console.log("staff-flat-ui: ok");
}

void run();
