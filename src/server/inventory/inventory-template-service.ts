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
  listTemplates(): Promise<InventoryTemplateRecord[]>;
  findTemplateById(templateId: string): Promise<InventoryTemplateRecord | null>;
  updateTemplate(template: InventoryTemplateRecord): Promise<InventoryTemplateRecord>;
  createTemplateItem(item: TemplateItemRecord): Promise<TemplateItemRecord>;
  findTemplateItemById(templateItemId: string): Promise<TemplateItemRecord | null>;
  findTemplateItemByTemplateAndInventoryItem(
    templateId: string,
    inventoryItemId: string
  ): Promise<TemplateItemRecord | null>;
  listTemplateItems(templateId: string): Promise<TemplateItemRecord[]>;
  updateTemplateItem(item: TemplateItemRecord): Promise<TemplateItemRecord>;
  removeTemplateItem(templateItemId: string): Promise<void>;
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

export interface UpdateInventoryTemplateInput {
  templateId: string;
  name?: string | null;
  description?: string | null;
  flatType?: string | null;
}

export interface AddTemplateItemInput {
  templateId: string;
  inventoryItemId: string;
  expectedQuantity: number;
}

export interface UpdateTemplateItemQuantityInput {
  templateId: string;
  templateItemId: string;
  expectedQuantity: number;
}

export interface RemoveTemplateItemInput {
  templateId: string;
  templateItemId: string;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
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
      name: normalizeRequiredText(input.name, "name"),
      description: normalizeOptionalText(input.description ?? null),
      flatType: normalizeOptionalText(input.flatType ?? null),
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return this.repository.createTemplate(template);
  }

  async listTemplates(): Promise<InventoryTemplateRecord[]> {
    const templates = await this.repository.listTemplates();
    return [...templates].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTemplate(templateId: string): Promise<{
    template: InventoryTemplateRecord;
    items: TemplateItemRecord[];
  }> {
    const template = await this.repository.findTemplateById(templateId);
    if (!template) {
      throw new Error("Inventory template not found.");
    }

    const items = await this.repository.listTemplateItems(template.id);
    return {
      template,
      items: [...items].sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId)),
    };
  }

  async updateTemplate(input: UpdateInventoryTemplateInput): Promise<InventoryTemplateRecord> {
    const template = await this.repository.findTemplateById(input.templateId);
    if (!template) {
      throw new Error("Inventory template not found.");
    }

    const updated = createInventoryTemplateRecord({
      ...template,
      name: input.name === undefined || input.name === null ? template.name : normalizeRequiredText(input.name, "name"),
      description: input.description === undefined ? template.description : normalizeOptionalText(input.description),
      flatType: input.flatType === undefined ? template.flatType : normalizeOptionalText(input.flatType),
      updatedAt: this.nowProvider().toISOString(),
    });

    return this.repository.updateTemplate(updated);
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

  async updateTemplateItemQuantity(input: UpdateTemplateItemQuantityInput): Promise<TemplateItemRecord> {
    const template = await this.repository.findTemplateById(input.templateId);
    if (!template) {
      throw new Error("Inventory template not found.");
    }

    const existing = await this.repository.findTemplateItemById(input.templateItemId);
    if (!existing || existing.templateId !== template.id) {
      throw new Error("Template item not found.");
    }

    const updated = createTemplateItemRecord({
      ...existing,
      expectedQuantity: input.expectedQuantity,
      updatedAt: this.nowProvider().toISOString(),
    });

    return this.repository.updateTemplateItem(updated);
  }

  async removeTemplateItem(input: RemoveTemplateItemInput): Promise<void> {
    const template = await this.repository.findTemplateById(input.templateId);
    if (!template) {
      throw new Error("Inventory template not found.");
    }

    const existing = await this.repository.findTemplateItemById(input.templateItemId);
    if (!existing || existing.templateId !== template.id) {
      throw new Error("Template item not found.");
    }

    await this.repository.removeTemplateItem(existing.id);
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
