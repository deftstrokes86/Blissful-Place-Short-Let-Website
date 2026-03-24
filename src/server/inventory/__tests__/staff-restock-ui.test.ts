import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { StaffRestockSnapshotView } from "../../../components/staff/StaffRestockSnapshotView";

async function testRestockViewRendersQuantityAndShortageFlows(): Promise<void> {
  const html = renderToStaticMarkup(
    StaffRestockSnapshotView({
      entries: [
        {
          flatId: "mayfair",
          flatName: "Mayfair Suite",
          recordId: "flat_inv_water",
          itemName: "Bottled Water",
          currentQuantity: 4,
          expectedQuantity: 12,
          neededQuantity: 8,
          note: "",
        },
      ],
      quantityDrafts: {
        flat_inv_water: "8",
      },
      noteDrafts: {
        flat_inv_water: "Vendor stock-out",
      },
      isSubmittingRecordId: null,
      onQuantityDraftChange: () => undefined,
      onNoteDraftChange: () => undefined,
      onMarkRestocked: async () => undefined,
      onReportShortage: async () => undefined,
    })
  );

  assert.ok(html.includes("Needs Restock"));
  assert.ok(html.includes("Current"));
  assert.ok(html.includes("Needed"));
  assert.ok(html.includes("Added Quantity"));
  assert.ok(html.includes("Mark Restocked"));
  assert.ok(html.includes("Report Shortage"));
  assert.ok(html.includes("Note shortage or problem"));
}

async function testRestockEmptyState(): Promise<void> {
  const html = renderToStaticMarkup(
    StaffRestockSnapshotView({
      entries: [],
      quantityDrafts: {},
      noteDrafts: {},
      isSubmittingRecordId: null,
      onQuantityDraftChange: () => undefined,
      onNoteDraftChange: () => undefined,
      onMarkRestocked: async () => undefined,
      onReportShortage: async () => undefined,
    })
  );

  assert.ok(html.includes("No flats need restock right now."));
}

async function run(): Promise<void> {
  await testRestockViewRendersQuantityAndShortageFlows();
  await testRestockEmptyState();

  console.log("staff-restock-ui: ok");
}

void run();
