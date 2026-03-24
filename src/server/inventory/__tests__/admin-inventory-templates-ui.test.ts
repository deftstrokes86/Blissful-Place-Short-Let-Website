import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminInventoryTemplatesSnapshotView } from "../../../components/admin/inventory/templates/AdminInventoryTemplatesSnapshotView";
import type { AdminInventoryTemplateSummary } from "../../../lib/admin-inventory-templates-api";

function createTemplates(): AdminInventoryTemplateSummary[] {
  return [
    {
      id: "template_1",
      name: "Executive Standard",
      description: "Base setup for executive flats",
      flatType: "executive",
      itemCount: 6,
      createdAt: "2026-11-20T10:00:00.000Z",
      updatedAt: "2026-11-20T10:00:00.000Z",
    },
    {
      id: "template_2",
      name: "Studio Essentials",
      description: null,
      flatType: "studio",
      itemCount: 4,
      createdAt: "2026-11-20T10:00:00.000Z",
      updatedAt: "2026-11-20T10:00:00.000Z",
    },
  ];
}

async function testTemplateListRendersScanableCardsAndActions(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryTemplatesSnapshotView({
      templates: createTemplates(),
    })
  );

  assert.ok(html.includes("Template Library"));
  assert.ok(html.includes("2 templates"));
  assert.ok(html.includes("Executive Standard"));
  assert.ok(html.includes("Studio Essentials"));
  assert.ok(html.includes("6 items"));
  assert.ok(html.includes("4 items"));
  assert.ok(html.includes("/admin/inventory/templates/template_1"));
  assert.ok(html.includes("Open Template"));
  assert.ok(html.includes("Apply to Flat"));
}

async function testTemplateListEmptyStateStaysActionable(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryTemplatesSnapshotView({
      templates: [],
    })
  );

  assert.ok(html.includes("No templates configured yet."));
  assert.ok(html.includes("Create First Template"));
  assert.ok(html.includes("/admin/inventory/templates/new"));
}

async function run(): Promise<void> {
  await testTemplateListRendersScanableCardsAndActions();
  await testTemplateListEmptyStateStaysActionable();

  console.log("admin-inventory-templates-ui: ok");
}

void run();
