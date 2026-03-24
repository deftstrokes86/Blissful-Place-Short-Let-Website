import assert from "node:assert/strict";

import { handleResolveInventoryAlertRequest } from "../admin-inventory-http";
import type { InventoryAlertRecord } from "../../../types/booking-backend";

class StubAlertResolveService {
  async resolveInventoryAlert(input: { alertId: string; note?: string | null }): Promise<InventoryAlertRecord> {
    return {
      id: input.alertId,
      inventoryItemId: "item_tv",
      flatId: "mayfair",
      alertType: "damaged_critical_asset",
      severity: "critical",
      status: "resolved",
      message: "Critical asset Smart TV is damaged.",
      createdAt: "2026-11-22T09:00:00.000Z",
      resolvedAt: "2026-11-22T09:30:00.000Z",
    };
  }
}

async function testResolveAlertValidationAndDelegation(): Promise<void> {
  const service = new StubAlertResolveService();

  await assert.rejects(
    async () => {
      await handleResolveInventoryAlertRequest(service, {
        alertId: null,
        note: null,
      });
    },
    /alertId is required/i
  );

  const result = await handleResolveInventoryAlertRequest(service, {
    alertId: "alert_1",
    note: "Resolved in maintenance workflow",
  });

  assert.equal(result.alert.id, "alert_1");
  assert.equal(result.alert.status, "resolved");
}

async function run(): Promise<void> {
  await testResolveAlertValidationAndDelegation();

  console.log("admin-inventory-alert-http: ok");
}

void run();
