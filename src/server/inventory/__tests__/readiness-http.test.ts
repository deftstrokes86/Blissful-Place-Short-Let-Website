import assert from "node:assert/strict";

import { handleUpdateFlatChecklistReadinessRequest } from "../readiness-http";
import type { ReadinessService } from "../readiness-service";
import type { FlatReadinessRecord } from "../../../types/booking-backend";

class StubReadinessService implements Pick<ReadinessService, "getReadiness" | "recomputeReadiness"> {
  async getReadiness(flatId: "windsor" | "kensington" | "mayfair"): Promise<FlatReadinessRecord | null> {
    return {
      flatId,
      cleaningStatus: "attention_required",
      linenStatus: "ready",
      consumablesStatus: "attention_required",
      maintenanceStatus: "blocked",
      criticalAssetStatus: "ready",
      readinessStatus: "out_of_service",
      overrideStatus: null,
      overrideReason: null,
      updatedAt: "2026-11-26T08:00:00.000Z",
    };
  }

  async recomputeReadiness(input: {
    flatId: "windsor" | "kensington" | "mayfair";
    cleaningStatus: "ready" | "attention_required" | "blocked";
    linenStatus: "ready" | "attention_required" | "blocked";
    consumablesStatus?: "ready" | "attention_required" | "blocked";
    maintenanceStatus?: "ready" | "attention_required" | "blocked";
    criticalAssetStatus?: "ready" | "attention_required" | "blocked";
  }): Promise<FlatReadinessRecord> {
    return {
      flatId: input.flatId,
      cleaningStatus: input.cleaningStatus,
      linenStatus: input.linenStatus,
      consumablesStatus: input.consumablesStatus ?? "ready",
      maintenanceStatus: input.maintenanceStatus ?? "ready",
      criticalAssetStatus: input.criticalAssetStatus ?? "ready",
      readinessStatus: "needs_attention",
      overrideStatus: null,
      overrideReason: null,
      updatedAt: "2026-11-26T09:00:00.000Z",
    };
  }
}

async function testChecklistReadinessValidation(): Promise<void> {
  const service = new StubReadinessService();

  await assert.rejects(
    async () => {
      await handleUpdateFlatChecklistReadinessRequest(service as unknown as ReadinessService, {
        flatId: "",
        cleaningCompleted: true,
        linenCompleted: true,
        consumablesCompleted: true,
      });
    },
    /flatId/i
  );

  await assert.rejects(
    async () => {
      await handleUpdateFlatChecklistReadinessRequest(service as unknown as ReadinessService, {
        flatId: "mayfair",
        cleaningCompleted: null,
        linenCompleted: true,
        consumablesCompleted: true,
      });
    },
    /required/i
  );
}

async function testChecklistReadinessMapsWorkerChecklistToStatuses(): Promise<void> {
  const service = new StubReadinessService();

  const result = await handleUpdateFlatChecklistReadinessRequest(service as unknown as ReadinessService, {
    flatId: "mayfair",
    cleaningCompleted: true,
    linenCompleted: false,
    consumablesCompleted: true,
  });

  assert.equal(result.readiness.flatId, "mayfair");
  assert.equal(result.readiness.cleaningStatus, "ready");
  assert.equal(result.readiness.linenStatus, "attention_required");
  assert.equal(result.readiness.consumablesStatus, "ready");
  assert.equal(result.readiness.maintenanceStatus, "blocked");
}

async function run(): Promise<void> {
  await testChecklistReadinessValidation();
  await testChecklistReadinessMapsWorkerChecklistToStatuses();

  console.log("readiness-http: ok");
}

void run();
