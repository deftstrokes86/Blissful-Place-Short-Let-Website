import { randomUUID } from "node:crypto";

import { createMaintenanceIssueRecord } from "../booking/inventory-domain";
import type {
  FlatRecord,
  InventoryItemRecord,
  InventoryAlertSeverity,
  MaintenanceIssueRecord,
} from "../../types/booking-backend";
import type { FlatId } from "../../types/booking";

type MaintenanceIssueIdPrefix = "maintenance_issue";

interface MaintenanceIssueServiceDependencies {
  repository: MaintenanceIssueRepository;
  readinessGateway: MaintenanceReadinessGateway;
  now?: () => Date;
  createId?: (prefix: MaintenanceIssueIdPrefix) => string;
}

export interface MaintenanceIssueRepository {
  findFlatById(flatId: FlatId): Promise<FlatRecord | null>;
  findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null>;
  createIssue(issue: MaintenanceIssueRecord): Promise<MaintenanceIssueRecord>;
  findIssueById(issueId: string): Promise<MaintenanceIssueRecord | null>;
  updateIssue(issue: MaintenanceIssueRecord): Promise<MaintenanceIssueRecord>;
  listIssues(filter?: { flatId?: FlatId; status?: MaintenanceIssueRecord["status"] }): Promise<MaintenanceIssueRecord[]>;
}

export interface MaintenanceReadinessGateway {
  syncFlatReadiness(flatId: FlatId): Promise<void>;
}

export interface CreateMaintenanceIssueInput {
  flatId: FlatId;
  inventoryItemId: string | null;
  title: string;
  notes: string | null;
  severity: InventoryAlertSeverity;
}

export interface UpdateMaintenanceIssueStatusInput {
  issueId: string;
  status: MaintenanceIssueRecord["status"];
  notes?: string | null;
}

export interface ResolveMaintenanceIssueInput {
  issueId: string;
  resolutionNote: string;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

export class MaintenanceIssueService {
  private readonly repository: MaintenanceIssueRepository;
  private readonly readinessGateway: MaintenanceReadinessGateway;
  private readonly nowProvider: () => Date;
  private readonly createId: (prefix: MaintenanceIssueIdPrefix) => string;

  constructor(dependencies: MaintenanceIssueServiceDependencies) {
    this.repository = dependencies.repository;
    this.readinessGateway = dependencies.readinessGateway;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
  }

  async createIssue(input: CreateMaintenanceIssueInput): Promise<MaintenanceIssueRecord> {
    const flat = await this.repository.findFlatById(input.flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    if (input.inventoryItemId) {
      const item = await this.repository.findInventoryItemById(input.inventoryItemId);
      if (!item) {
        throw new Error("Inventory item not found.");
      }
    }

    const nowIso = this.nowProvider().toISOString();
    const record = createMaintenanceIssueRecord({
      id: this.createId("maintenance_issue"),
      flatId: flat.id,
      inventoryItemId: input.inventoryItemId,
      title: normalizeRequiredText(input.title, "title"),
      notes: normalizeOptionalText(input.notes),
      severity: input.severity,
      status: "open",
      createdAt: nowIso,
      updatedAt: nowIso,
      resolvedAt: null,
    });

    const created = await this.repository.createIssue(record);
    await this.readinessGateway.syncFlatReadiness(created.flatId);
    return created;
  }

  async updateIssueStatus(input: UpdateMaintenanceIssueStatusInput): Promise<MaintenanceIssueRecord> {
    const issue = await this.repository.findIssueById(input.issueId);
    if (!issue) {
      throw new Error("Maintenance issue not found.");
    }

    const nowIso = this.nowProvider().toISOString();
    const notes = input.notes === undefined ? issue.notes : normalizeOptionalText(input.notes);
    const resolvedAt =
      input.status === "resolved"
        ? nowIso
        : input.status === "closed"
          ? issue.resolvedAt
          : null;

    const updated = createMaintenanceIssueRecord({
      ...issue,
      status: input.status,
      notes,
      resolvedAt,
      updatedAt: nowIso,
    });

    const stored = await this.repository.updateIssue(updated);
    await this.readinessGateway.syncFlatReadiness(stored.flatId);
    return stored;
  }

  async resolveIssue(input: ResolveMaintenanceIssueInput): Promise<MaintenanceIssueRecord> {
    const issue = await this.repository.findIssueById(input.issueId);
    if (!issue) {
      throw new Error("Maintenance issue not found.");
    }

    const nowIso = this.nowProvider().toISOString();
    const resolved = createMaintenanceIssueRecord({
      ...issue,
      status: "resolved",
      notes: normalizeRequiredText(input.resolutionNote, "resolutionNote"),
      resolvedAt: nowIso,
      updatedAt: nowIso,
    });

    const stored = await this.repository.updateIssue(resolved);
    await this.readinessGateway.syncFlatReadiness(stored.flatId);
    return stored;
  }

  async listIssues(filter?: {
    flatId?: FlatId;
    status?: MaintenanceIssueRecord["status"];
  }): Promise<MaintenanceIssueRecord[]> {
    const issues = await this.repository.listIssues(filter);
    return [...issues].sort((a, b) => {
      const createdDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (createdDiff !== 0) {
        return createdDiff;
      }

      return a.id.localeCompare(b.id);
    });
  }
}
