import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminInventoryItemCreateSnapshotView } from "../../../components/admin/inventory/items/AdminInventoryItemCreateSnapshotView";

async function testItemCreateViewRendersOperationalForm(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryItemCreateSnapshotView({
      form: {
        name: "",
        category: "asset",
        unitOfMeasure: "piece",
        internalCode: "",
        reorderThreshold: "",
        parLevel: "1",
        criticality: "important",
      },
      isSubmitting: false,
      onChange: () => undefined,
      onSubmit: async () => undefined,
    })
  );

  assert.ok(html.includes("Create Inventory Item"));
  assert.ok(html.includes("Item Name"));
  assert.ok(html.includes("Category"));
  assert.ok(html.includes("Unit"));
  assert.ok(html.includes("Criticality"));
  assert.ok(html.includes("Create Item"));
}

async function run(): Promise<void> {
  await testItemCreateViewRendersOperationalForm();

  console.log("admin-inventory-item-ui: ok");
}

void run();
