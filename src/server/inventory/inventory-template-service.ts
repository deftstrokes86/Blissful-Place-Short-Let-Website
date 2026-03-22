import { randomUUID } from "node:crypto";

import { createInventoryTemplateRecord, createTemplateItemRecord } from "../booking/inventory-domain";
import type {
  InventoryItemRecord,
  InventoryTemplateRecord,
  TemplateItemRecord,
} from "../../types/booking-backend";

type TemplateIdPrefix = "template" | "template_item";

export interface InventoryTemplateRepository {
  createTemplate(template: InventoryTemplateRecord): Promise<InventoryTemplateRecord>;
  findTemplateById(templateId: string): Promise<InventoryTemplateRecord | null>;
  createTemplateItem(item: TemplateItemRecord): Promise<TemplateItemRecord>;
  findTemplateItemByTemplateAndInventoryItem(
    templateId: string,
    inventoryItemId: string
  ): Promise<TemplateItemRecord | null>;
  listTemplateItems(templateId: string): Promise<TemplateItemRecord[]>;
  findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null>;
}

interface InventoryTemplateServiceDependencies {
  repository: InventoryTemplateRepository;
  now?: () => Date;
  createId?: (prefix: TemplateIdPrefix) => string;
}

export interface CreateInventoryTemplateInput {
  name: string;
  description?: string | null;
  flatType?: string | null;
}

export interface AddTemplateItemInput {
  templateId: string;
  inventoryItemId: string;
  expectedQuantity: number;
}

export class InventoryTemplateService {
  private readonly repository: InventoryTemplateRepository;
  private readonly nowProvider: () => Date;
  private readonly createId: (prefix: TemplateIdPrefix) => string;

  constructor(dependencies: InventoryTemplateServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
  }

  async createTemplate(input: CreateInventoryTemplateInput): Promise<InventoryTemplateRecord> {
    const nowIso = this.nowProvider().toISOString();
    const template = createInventoryTemplateRecord({
      id: this.createId("template"),
      name: input.name,
      description: input.description ?? null,
      flatType: input.flatType ?? null,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return this.repository.createTemplate(template);
  }

  async addTemplateItem(input: AddTemplateItemInput): Promise<TemplateItemRecord> {
    const template = await this.repository.findTemplateById(input.templateId);
    if (!template) {
      throw new Error("Inventory template not found.");
    }

    const itemDefinition = await this.repository.findInventoryItemById(input.inventoryItemId);
    if (!itemDefinition) {
      throw new Error("Inventory item not found.");
    }

    const existing = await this.repository.findTemplateItemByTemplateAndInventoryItem(
      input.templateId,
      input.inventoryItemId
    );
    if (existing) {
      throw new Error("Template item already exists for this inventory item.");
    }

    const nowIso = this.nowProvider().toISOString();
    const templateItem = createTemplateItemRecord({
      id: this.createId("template_item"),
      templateId: template.id,
      inventoryItemId: itemDefinition.id,
      expectedQuantity: input.expectedQuantity,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return this.repository.createTemplateItem(templateItem);
  }

  async listTemplateItems(templateId: string): Promise<TemplateItemRecord[]> {
    const template = await this.repository.findTemplateById(templateId);
    if (!template) {
      throw new Error("Inventory template not found.");
    }

    const items = await this.repository.listTemplateItems(template.id);
    return [...items].sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId));
  }
}
