import { randomUUID } from "node:crypto";

import { createInventoryAlertRecord } from "../booking/inventory-domain";
import type {
  FlatReadinessRecord,
  FlatRecord,
  InventoryAlertRecord,
  InventoryAlertSeverity,
  InventoryItemCriticality,
} from "../../types/booking-backend";
import type { FlatId } from "../../types/booking";
import type { FlatInventorySignal } from "./readiness-service";

type InventoryAlertIdPrefix = "inventory_alert";

interface InventoryAlertServiceDependencies {
  repository: InventoryAlertRepository;
  now?: () => Date;
  createId?: (prefix: InventoryAlertIdPrefix) => string;
}

interface InventoryAlertCandidate {
  flatId: FlatId;
  inventoryItemId: string | null;
  alertType: InventoryAlertRecord["alertType"];
  severity: InventoryAlertSeverity;
  message: string;
}

export interface InventoryAlertSignal {
  inventory: FlatInventorySignal["inventory"];
  item: FlatInventorySignal["item"];
}

export interface InventoryAlertRepository {
  findFlatById(flatId: FlatId): Promise<FlatRecord | null>;
  listInventorySignals(flatId: FlatId): Promise<InventoryAlertSignal[]>;
  findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null>;
  listFlatAlerts(flatId: FlatId): Promise<InventoryAlertRecord[]>;
  findAlertById(alertId: string): Promise<InventoryAlertRecord | null>;
  createAlert(alert: InventoryAlertRecord): Promise<InventoryAlertRecord>;
  updateAlert(alert: InventoryAlertRecord): Promise<InventoryAlertRecord>;
}

export interface SyncInventoryAlertsResult {
  created: InventoryAlertRecord[];
  updated: InventoryAlertRecord[];
  resolved: InventoryAlertRecord[];
  unchanged: InventoryAlertRecord[];
}

function criticalityToSeverity(criticality: InventoryItemCriticality): InventoryAlertSeverity {
  return criticality;
}

function isDamagedCondition(condition: InventoryAlertSignal["inventory"]["conditionStatus"]): boolean {
  return condition === "damaged" || condition === "needs_replacement";
}

function isMissingCondition(condition: InventoryAlertSignal["inventory"]["conditionStatus"]): boolean {
  return condition === "missing";
}

function buildAlertKey(candidate: Pick<InventoryAlertCandidate, "flatId" | "alertType" | "inventoryItemId">): string {
  return `${candidate.flatId}:${candidate.alertType}:${candidate.inventoryItemId ?? "none"}`;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export class InventoryAlertService {
  private readonly repository: InventoryAlertRepository;
  private readonly nowProvider: () => Date;
  private readonly createId: (prefix: InventoryAlertIdPrefix) => string;

  constructor(dependencies: InventoryAlertServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
  }

  async syncFlatAlerts(flatId: FlatId): Promise<SyncInventoryAlertsResult> {
    const flat = await this.repository.findFlatById(flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    const [signals, readiness, existingAlerts] = await Promise.all([
      this.repository.listInventorySignals(flat.id),
      this.repository.findFlatReadiness(flat.id),
      this.repository.listFlatAlerts(flat.id),
    ]);

    const nowIso = this.nowProvider().toISOString();
    const desired = this.deriveCandidates(flat, signals, readiness);
    const unresolved = existingAlerts.filter((alert) => alert.status !== "resolved");
    const unresolvedByKey = new Map<string, InventoryAlertRecord[]>();

    for (const alert of unresolved) {
      const key = buildAlertKey({
        flatId: alert.flatId ?? flat.id,
        alertType: alert.alertType,
        inventoryItemId: alert.inventoryItemId,
      });
      const group = unresolvedByKey.get(key) ?? [];
      group.push(alert);
      unresolvedByKey.set(key, group);
    }

    const created: InventoryAlertRecord[] = [];
    const updated: InventoryAlertRecord[] = [];
    const resolved: InventoryAlertRecord[] = [];
    const unchanged: InventoryAlertRecord[] = [];
    const keepOpenIds = new Set<string>();

    for (const candidate of desired) {
      const key = buildAlertKey(candidate);
      const existingGroup = unresolvedByKey.get(key) ?? [];

      if (existingGroup.length === 0) {
        const createdRecord = createInventoryAlertRecord({
          id: this.createId("inventory_alert"),
          inventoryItemId: candidate.inventoryItemId,
          flatId: candidate.flatId,
          alertType: candidate.alertType,
          severity: candidate.severity,
          status: "open",
          message: candidate.message,
          createdAt: nowIso,
          resolvedAt: null,
        });

        created.push(await this.repository.createAlert(createdRecord));
        continue;
      }

      const canonical = existingGroup[0];
      keepOpenIds.add(canonical.id);

      if (canonical.message !== candidate.message || canonical.severity !== candidate.severity) {
        const updatedRecord = createInventoryAlertRecord({
          ...canonical,
          message: candidate.message,
          severity: candidate.severity,
        });
        updated.push(await this.repository.updateAlert(updatedRecord));
      } else {
        unchanged.push(canonical);
      }

      for (let index = 1; index < existingGroup.length; index += 1) {
        const duplicate = existingGroup[index];
        const resolvedDuplicate = createInventoryAlertRecord({
          ...duplicate,
          status: "resolved",
          resolvedAt: nowIso,
        });
        resolved.push(await this.repository.updateAlert(resolvedDuplicate));
      }
    }

    for (const alert of unresolved) {
      if (keepOpenIds.has(alert.id)) {
        continue;
      }

      const key = buildAlertKey({
        flatId: alert.flatId ?? flat.id,
        alertType: alert.alertType,
        inventoryItemId: alert.inventoryItemId,
      });

      const stillDesired = desired.some((candidate) => buildAlertKey(candidate) === key);
      if (stillDesired) {
        continue;
      }

      const resolvedRecord = createInventoryAlertRecord({
        ...alert,
        status: "resolved",
        resolvedAt: nowIso,
      });
      resolved.push(await this.repository.updateAlert(resolvedRecord));
    }

    return {
      created,
      updated,
      resolved,
      unchanged,
    };
  }

  async listFlatAlerts(flatId: FlatId): Promise<InventoryAlertRecord[]> {
    const flat = await this.repository.findFlatById(flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    const alerts = await this.repository.listFlatAlerts(flat.id);
    return [...alerts].sort((a, b) => {
      const createdDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (createdDiff !== 0) {
        return createdDiff;
      }

      return a.id.localeCompare(b.id);
    });
  }

  async resolveAlert(input: {
    alertId: string;
    note?: string | null;
  }): Promise<InventoryAlertRecord> {
    const existing = await this.repository.findAlertById(input.alertId);
    if (!existing) {
      throw new Error("Inventory alert not found.");
    }

    if (existing.status === "resolved") {
      return existing;
    }

    const note = normalizeOptionalText(input.note);

    const resolved = createInventoryAlertRecord({
      ...existing,
      status: "resolved",
      message: note ? `${existing.message} (${note})` : existing.message,
      resolvedAt: this.nowProvider().toISOString(),
    });

    return this.repository.updateAlert(resolved);
  }

  private deriveCandidates(
    flat: FlatRecord,
    signals: readonly InventoryAlertSignal[],
    readiness: FlatReadinessRecord | null
  ): InventoryAlertCandidate[] {
    const candidates: InventoryAlertCandidate[] = [];

    for (const signal of signals) {
      const inventoryItemId = signal.item.id;
      const expectedQuantity = signal.inventory.expectedQuantity;
      const currentQuantity = signal.inventory.currentQuantity;
      const conditionStatus = signal.inventory.conditionStatus;

      if (expectedQuantity > 0 && (currentQuantity <= 0 || isMissingCondition(conditionStatus))) {
        candidates.push({
          flatId: flat.id,
          inventoryItemId,
          alertType: "missing_required_item",
          severity: criticalityToSeverity(signal.item.criticality),
          message: `${signal.item.name} is missing for ${flat.name}.`,
        });
        continue;
      }

      if (signal.item.criticality === "critical" && isDamagedCondition(conditionStatus)) {
        candidates.push({
          flatId: flat.id,
          inventoryItemId,
          alertType: "damaged_critical_asset",
          severity: "critical",
          message: `Critical asset ${signal.item.name} is damaged in ${flat.name}.`,
        });
        continue;
      }

      if (expectedQuantity > 0 && currentQuantity < expectedQuantity) {
        candidates.push({
          flatId: flat.id,
          inventoryItemId,
          alertType: "low_stock",
          severity: criticalityToSeverity(signal.item.criticality),
          message: `${signal.item.name} stock is below expected level in ${flat.name}.`,
        });
      }
    }

    if (readiness && readiness.readinessStatus !== "ready") {
      candidates.push({
        flatId: flat.id,
        inventoryItemId: null,
        alertType: "readiness_issue",
        severity: readiness.readinessStatus === "out_of_service" ? "critical" : "important",
        message: `${flat.name} readiness is ${readiness.readinessStatus.replace("_", " ")}.`,
      });
    }

    return this.dedupeCandidates(candidates);
  }

  private dedupeCandidates(candidates: readonly InventoryAlertCandidate[]): InventoryAlertCandidate[] {
    const byKey = new Map<string, InventoryAlertCandidate>();
    for (const candidate of candidates) {
      byKey.set(buildAlertKey(candidate), candidate);
    }

    return Array.from(byKey.values());
  }
}
