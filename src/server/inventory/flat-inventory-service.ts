import { randomUUID } from "node:crypto";

import { createFlatInventoryRecord } from "../booking/inventory-domain";
import type {
  FlatInventoryRecord,
  FlatRecord,
  InventoryItemRecord,
  InventoryTemplateRecord,
  TemplateItemRecord,
} from "../../types/booking-backend";
import type { FlatId } from "../../types/booking";

type FlatInventoryIdPrefix = "flat_inventory";

export interface FlatInventoryRepository {
  findFlatById(flatId: FlatId): Promise<FlatRecord | null>;
  findTemplateById(templateId: string): Promise<InventoryTemplateRecord | null>;
  listTemplateItems(templateId: string): Promise<TemplateItemRecord[]>;
  findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null>;
  findFlatInventoryByFlatAndItem(flatId: FlatId, inventoryItemId: string): Promise<FlatInventoryRecord | null>;
  createFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord>;
  updateFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord>;
  listFlatInventory(flatId: FlatId): Promise<FlatInventoryRecord[]>;
}

interface FlatInventoryServiceDependencies {
  repository: FlatInventoryRepository;
  now?: () => Date;
  createId?: (prefix: FlatInventoryIdPrefix) => string;
}

export interface ApplyTemplateToFlatInput {
  templateId: string;
  flatId: FlatId;
}

export interface ApplyTemplateToFlatResult {
  templateId: string;
  flatId: FlatId;
  createdCount: number;
  updatedCount: number;
  totalTemplateItems: number;
}

export class FlatInventoryService {
  private readonly repository: FlatInventoryRepository;
  private readonly nowProvider: () => Date;
  private readonly createId: (prefix: FlatInventoryIdPrefix) => string;

  constructor(dependencies: FlatInventoryServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
  }

  async applyTemplateToFlat(input: ApplyTemplateToFlatInput): Promise<ApplyTemplateToFlatResult> {
    const flat = await this.repository.findFlatById(input.flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    const template = await this.repository.findTemplateById(input.templateId);
    if (!template) {
      throw new Error("Template not found.");
    }

    const templateItems = await this.repository.listTemplateItems(template.id);
    const duplicateIds = this.findDuplicateTemplateItemIds(templateItems);
    if (duplicateIds.length > 0) {
      throw new Error("Template contains duplicate template items for the same inventory item.");
    }

    let createdCount = 0;
    let updatedCount = 0;
    const nowIso = this.nowProvider().toISOString();

    for (const templateItem of templateItems) {
      const definition = await this.repository.findInventoryItemById(templateItem.inventoryItemId);
      if (!definition) {
        throw new Error(`Inventory item not found: ${templateItem.inventoryItemId}`);
      }

      const existing = await this.repository.findFlatInventoryByFlatAndItem(flat.id, templateItem.inventoryItemId);
      if (existing) {
        const updated = createFlatInventoryRecord({
          ...existing,
          expectedQuantity: templateItem.expectedQuantity,
          updatedAt: nowIso,
        });

        await this.repository.updateFlatInventory(updated);
        updatedCount += 1;
        continue;
      }

      const created = createFlatInventoryRecord({
        id: this.createId("flat_inventory"),
        flatId: flat.id,
        inventoryItemId: templateItem.inventoryItemId,
        expectedQuantity: templateItem.expectedQuantity,
        currentQuantity: templateItem.expectedQuantity,
        conditionStatus: "ok",
        notes: null,
        lastCheckedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await this.repository.createFlatInventory(created);
      createdCount += 1;
    }

    return {
      templateId: template.id,
      flatId: flat.id,
      createdCount,
      updatedCount,
      totalTemplateItems: templateItems.length,
    };
  }

  async syncFlatInventoryExpectationsFromTemplate(input: ApplyTemplateToFlatInput): Promise<ApplyTemplateToFlatResult> {
    return this.applyTemplateToFlat(input);
  }

  async loadFlatInventory(flatId: FlatId): Promise<FlatInventoryRecord[]> {
    const flat = await this.repository.findFlatById(flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    const records = await this.repository.listFlatInventory(flat.id);
    return [...records].sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId));
  }

  private findDuplicateTemplateItemIds(templateItems: readonly TemplateItemRecord[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const templateItem of templateItems) {
      if (seen.has(templateItem.inventoryItemId)) {
        duplicates.add(templateItem.inventoryItemId);
        continue;
      }

      seen.add(templateItem.inventoryItemId);
    }

    return Array.from(duplicates);
  }
}
