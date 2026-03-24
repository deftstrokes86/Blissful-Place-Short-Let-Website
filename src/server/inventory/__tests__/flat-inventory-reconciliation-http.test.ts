import assert from "node:assert/strict";

import {
  handleClearFlatReadinessOverrideRequest,
  handleReconcileFlatInventoryRecordRequest,
  handleSetFlatReadinessOverrideRequest,
  type FlatInventoryReconciliationOperationsService,
} from "../flat-inventory-reconciliation-http";
import type { FlatInventoryRecord, FlatReadinessRecord, StockMovementRecord } from "../../../types/booking-backend";

class StubFlatInventoryReconciliationOperationsService implements FlatInventoryReconciliationOperationsService {
  async reconcileRecord(input: {
    flatId: "windsor" | "kensington" | "mayfair";
    flatInventoryId: string;
    action: "adjust_quantity" | "mark_missing" | "mark_damaged" | "mark_replaced" | "note_discrepancy" | "restocked_now";
    quantity?: number | null;
    note?: string | null;
  }): Promise<{ record: FlatInventoryRecord; movement: StockMovementRecord | null }> {
    return {
      record: {
        id: input.flatInventoryId,
        flatId: input.flatId,
        inventoryItemId: "item_1",
        expectedQuantity: 3,
        currentQuantity: input.quantity ?? 2,
        conditionStatus: "ok",
        notes: input.note ?? null,
        lastCheckedAt: "2026-11-21T08:00:00.000Z",
        createdAt: "2026-11-21T08:00:00.000Z",
        updatedAt: "2026-11-21T08:00:00.000Z",
      },
      movement: null,
    };
  }

  async setReadinessOverride(input: {
    flatId: "windsor" | "kensington" | "mayfair";
    overrideStatus: "ready" | "needs_attention" | "out_of_service";
    reason: string;
  }): Promise<FlatReadinessRecord> {
    return {
      flatId: input.flatId,
      cleaningStatus: "ready",
      linenStatus: "ready",
      consumablesStatus: "attention_required",
      maintenanceStatus: "ready",
      criticalAssetStatus: "ready",
      readinessStatus: input.overrideStatus,
      overrideStatus: input.overrideStatus,
      overrideReason: input.reason,
      updatedAt: "2026-11-21T09:00:00.000Z",
    };
  }

  async clearReadinessOverride(input: {
    flatId: "windsor" | "kensington" | "mayfair";
  }): Promise<FlatReadinessRecord> {
    return {
      flatId: input.flatId,
      cleaningStatus: "ready",
      linenStatus: "ready",
      consumablesStatus: "attention_required",
      maintenanceStatus: "ready",
      criticalAssetStatus: "ready",
      readinessStatus: "needs_attention",
      overrideStatus: null,
      overrideReason: null,
      updatedAt: "2026-11-21T09:30:00.000Z",
    };
  }
}

async function testReconciliationValidationAndDelegation(): Promise<void> {
  const service = new StubFlatInventoryReconciliationOperationsService();

  await assert.rejects(
    async () => {
      await handleReconcileFlatInventoryRecordRequest(service, {
        flatId: "invalid",
        flatInventoryId: "flat_inv_1",
        action: "adjust_quantity",
        quantity: 5,
        note: null,
      });
    },
    /valid flatId/i
  );

  const result = await handleReconcileFlatInventoryRecordRequest(service, {
    flatId: "mayfair",
    flatInventoryId: "flat_inv_1",
    action: "adjust_quantity",
    quantity: 5,
    note: "Cycle count",
  });

  assert.equal(result.record.id, "flat_inv_1");
  assert.equal(result.record.currentQuantity, 5);
}

async function testReadinessOverrideValidationAndDelegation(): Promise<void> {
  const service = new StubFlatInventoryReconciliationOperationsService();

  await assert.rejects(
    async () => {
      await handleSetFlatReadinessOverrideRequest(service, {
        flatId: "mayfair",
        overrideStatus: "unknown",
        reason: "Manual hold",
      });
    },
    /valid overrideStatus/i
  );

  const setResult = await handleSetFlatReadinessOverrideRequest(service, {
    flatId: "mayfair",
    overrideStatus: "out_of_service",
    reason: "Manual hold",
  });

  assert.equal(setResult.readiness.overrideStatus, "out_of_service");

  const clearResult = await handleClearFlatReadinessOverrideRequest(service, {
    flatId: "mayfair",
  });

  assert.equal(clearResult.readiness.overrideStatus, null);
}

async function run(): Promise<void> {
  await testReconciliationValidationAndDelegation();
  await testReadinessOverrideValidationAndDelegation();

  console.log("flat-inventory-reconciliation-http: ok");
}

void run();
