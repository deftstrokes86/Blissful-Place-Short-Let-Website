import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminInventoryMovementCreateSnapshotView } from "../../../components/admin/inventory/movements/AdminInventoryMovementCreateSnapshotView";

async function testMovementCreateViewRendersMovementAndTransferForms(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryMovementCreateSnapshotView({
      itemOptions: [
        {
          id: "item_water",
          name: "Bottled Water",
        },
      ],
      movementForm: {
        movementType: "add",
        inventoryItemId: "item_water",
        quantity: "5",
        adjustToQuantity: "",
        flatId: "",
        reason: "Restock",
        notes: "",
      },
      transferForm: {
        inventoryItemId: "item_water",
        quantity: "5",
        fromFlatId: "",
        toFlatId: "mayfair",
        reason: "Replenish flat",
        notes: "",
      },
      isSubmitting: false,
      onMovementChange: () => undefined,
      onTransferChange: () => undefined,
      onCreateMovement: async () => undefined,
      onCreateTransfer: async () => undefined,
    })
  );

  assert.ok(html.includes("Record Stock Movement"));
  assert.ok(html.includes("Movement Type"));
  assert.ok(html.includes("Create Movement"));
  assert.ok(html.includes("Transfer Stock"));
  assert.ok(html.includes("From"));
  assert.ok(html.includes("To"));
  assert.ok(html.includes("Create Transfer"));
}

async function run(): Promise<void> {
  await testMovementCreateViewRendersMovementAndTransferForms();

  console.log("admin-inventory-movement-ui: ok");
}

void run();
