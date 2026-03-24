import type { FlatId } from "../../types/booking";
import type { InventoryTemplateRecord, TemplateItemRecord } from "../../types/booking-backend";

const FLAT_IDS: readonly FlatId[] = ["windsor", "kensington", "mayfair"];

function normalizeRequiredString(value: string | null | undefined, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`${field} is required.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizePositiveInteger(value: number | null | undefined, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }

  return value;
}

function normalizeFlatId(value: string | null | undefined): FlatId {
  const normalized = normalizeRequiredString(value, "flatId");
  if (!FLAT_IDS.includes(normalized as FlatId)) {
    throw new Error("A valid flatId is required.");
  }

  return normalized as FlatId;
}

export interface InventoryTemplateOperationsService {
  listTemplates(): Promise<InventoryTemplateRecord[]>;
  getTemplate(templateId: string): Promise<{
    template: InventoryTemplateRecord;
    items: TemplateItemRecord[];
  }>;
  createTemplate(input: {
    name: string;
    description?: string | null;
    flatType?: string | null;
  }): Promise<InventoryTemplateRecord>;
  updateTemplate(input: {
    templateId: string;
    name?: string | null;
    description?: string | null;
    flatType?: string | null;
  }): Promise<InventoryTemplateRecord>;
  addTemplateItem(input: {
    templateId: string;
    inventoryItemId: string;
    expectedQuantity: number;
  }): Promise<TemplateItemRecord>;
  updateTemplateItemQuantity(input: {
    templateId: string;
    templateItemId: string;
    expectedQuantity: number;
  }): Promise<TemplateItemRecord>;
  removeTemplateItem(input: {
    templateId: string;
    templateItemId: string;
  }): Promise<void>;
  applyTemplateToFlat(input: {
    templateId: string;
    flatId: FlatId;
  }): Promise<{
    templateId: string;
    flatId: FlatId;
    createdCount: number;
    updatedCount: number;
    totalTemplateItems: number;
  }>;
}

export async function handleListTemplatesRequest(service: InventoryTemplateOperationsService) {
  const templates = await service.listTemplates();

  const entries = await Promise.all(
    templates.map(async (template) => {
      const detail = await service.getTemplate(template.id);
      return {
        template,
        itemCount: detail.items.length,
      };
    })
  );

  return { templates: entries };
}

export async function handleGetTemplateRequest(
  service: InventoryTemplateOperationsService,
  input: { templateId: string | null }
) {
  const templateId = normalizeRequiredString(input.templateId, "templateId");
  const result = await service.getTemplate(templateId);
  return result;
}

export async function handleCreateTemplateRequest(
  service: InventoryTemplateOperationsService,
  input: {
    name: string | null;
    description: string | null;
    flatType: string | null;
  }
) {
  const template = await service.createTemplate({
    name: normalizeRequiredString(input.name, "name"),
    description: normalizeOptionalString(input.description),
    flatType: normalizeOptionalString(input.flatType),
  });

  return { template };
}

export async function handleUpdateTemplateRequest(
  service: InventoryTemplateOperationsService,
  input: {
    templateId: string | null;
    name: string | null;
    description: string | null;
    flatType: string | null;
  }
) {
  const templateId = normalizeRequiredString(input.templateId, "templateId");

  const template = await service.updateTemplate({
    templateId,
    name: input.name !== null ? normalizeRequiredString(input.name, "name") : undefined,
    description: input.description,
    flatType: input.flatType,
  });

  return { template };
}

export async function handleAddTemplateItemRequest(
  service: InventoryTemplateOperationsService,
  input: {
    templateId: string | null;
    inventoryItemId: string | null;
    expectedQuantity: number | null;
  }
) {
  const templateItem = await service.addTemplateItem({
    templateId: normalizeRequiredString(input.templateId, "templateId"),
    inventoryItemId: normalizeRequiredString(input.inventoryItemId, "inventoryItemId"),
    expectedQuantity: normalizePositiveInteger(input.expectedQuantity, "expectedQuantity"),
  });

  return { templateItem };
}

export async function handleUpdateTemplateItemQuantityRequest(
  service: InventoryTemplateOperationsService,
  input: {
    templateId: string | null;
    templateItemId: string | null;
    expectedQuantity: number | null;
  }
) {
  const templateItem = await service.updateTemplateItemQuantity({
    templateId: normalizeRequiredString(input.templateId, "templateId"),
    templateItemId: normalizeRequiredString(input.templateItemId, "templateItemId"),
    expectedQuantity: normalizePositiveInteger(input.expectedQuantity, "expectedQuantity"),
  });

  return { templateItem };
}

export async function handleRemoveTemplateItemRequest(
  service: InventoryTemplateOperationsService,
  input: {
    templateId: string | null;
    templateItemId: string | null;
  }
) {
  await service.removeTemplateItem({
    templateId: normalizeRequiredString(input.templateId, "templateId"),
    templateItemId: normalizeRequiredString(input.templateItemId, "templateItemId"),
  });

  return { ok: true as const };
}

export async function handleApplyTemplateToFlatRequest(
  service: InventoryTemplateOperationsService,
  input: {
    templateId: string | null;
    flatId: string | null;
  }
) {
  const result = await service.applyTemplateToFlat({
    templateId: normalizeRequiredString(input.templateId, "templateId"),
    flatId: normalizeFlatId(input.flatId),
  });

  return { result };
}
