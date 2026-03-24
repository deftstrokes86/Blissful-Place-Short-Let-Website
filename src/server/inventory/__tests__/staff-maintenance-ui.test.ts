import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import type { AdminMaintenanceIssue } from "../../../lib/admin-inventory-api";
import { StaffMaintenanceSnapshotView } from "../../../components/staff/StaffMaintenanceSnapshotView";

function createIssues(): AdminMaintenanceIssue[] {
  return [
    {
      id: "issue_1",
      flatId: "mayfair",
      inventoryItemId: "item_tv",
      title: "TV is not powering on",
      notes: "Guest reported no display",
      severity: "important",
      status: "open",
      createdAt: "2026-11-25T08:00:00.000Z",
      updatedAt: "2026-11-25T08:00:00.000Z",
      resolvedAt: null,
    },
  ];
}

async function testMaintenanceViewRendersUpdateAndEscalationActions(): Promise<void> {
  const html = renderToStaticMarkup(
    StaffMaintenanceSnapshotView({
      issues: createIssues(),
      noteDrafts: {
        issue_1: "Technician requested",
      },
      isSubmittingIssueId: null,
      onNoteDraftChange: () => undefined,
      onMarkInProgress: async () => undefined,
      onMarkFixed: async () => undefined,
      onEscalate: async () => undefined,
    })
  );

  assert.ok(html.includes("Maintenance Work"));
  assert.ok(html.includes("Mark In Progress"));
  assert.ok(html.includes("Mark Fixed"));
  assert.ok(html.includes("Escalate"));
  assert.ok(html.includes("Add Note"));
}

async function testMaintenanceEmptyState(): Promise<void> {
  const html = renderToStaticMarkup(
    StaffMaintenanceSnapshotView({
      issues: [],
      noteDrafts: {},
      isSubmittingIssueId: null,
      onNoteDraftChange: () => undefined,
      onMarkInProgress: async () => undefined,
      onMarkFixed: async () => undefined,
      onEscalate: async () => undefined,
    })
  );

  assert.ok(html.includes("No maintenance issues assigned right now."));
}

async function run(): Promise<void> {
  await testMaintenanceViewRendersUpdateAndEscalationActions();
  await testMaintenanceEmptyState();

  console.log("staff-maintenance-ui: ok");
}

void run();
