import type { FlatId } from "../../types/booking";
import type { ReadinessService } from "./readiness-service";

const FLAT_IDS: readonly FlatId[] = ["windsor", "kensington", "mayfair"];

function normalizeFlatId(value: string | null | undefined): FlatId | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return FLAT_IDS.includes(normalized as FlatId) ? (normalized as FlatId) : null;
}

function statusFromCompleted(completed: boolean): "ready" | "attention_required" {
  return completed ? "ready" : "attention_required";
}

export async function handleUpdateFlatChecklistReadinessRequest(
  service: Pick<ReadinessService, "getReadiness" | "recomputeReadiness">,
  input: {
    flatId: string | null;
    cleaningCompleted: boolean | null;
    linenCompleted: boolean | null;
    consumablesCompleted: boolean | null;
  }
) {
  const flatId = normalizeFlatId(input.flatId);
  if (!flatId) {
    throw new Error("A valid flatId is required.");
  }

  if (
    input.cleaningCompleted === null ||
    input.linenCompleted === null ||
    input.consumablesCompleted === null
  ) {
    throw new Error("cleaningCompleted, linenCompleted, and consumablesCompleted are required.");
  }

  const current = await service.getReadiness(flatId);

  const readiness = await service.recomputeReadiness({
    flatId,
    cleaningStatus: statusFromCompleted(input.cleaningCompleted),
    linenStatus: statusFromCompleted(input.linenCompleted),
    consumablesStatus: statusFromCompleted(input.consumablesCompleted),
    maintenanceStatus: current?.maintenanceStatus ?? "ready",
    criticalAssetStatus: current?.criticalAssetStatus ?? "ready",
  });

  return { readiness };
}
