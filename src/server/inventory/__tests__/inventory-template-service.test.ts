import assert from "node:assert/strict";

import {
  InventoryTemplateService,
  type InventoryTemplateRepository,
} from "../inventory-template-service";
import type {
  InventoryItemRecord,
  InventoryTemplateRecord,
  TemplateItemRecord,
} from "../../../types/booking-backend";

class InMemoryInventoryTemplateRepository implements InventoryTemplateRepository {
  private readonly templates = new Map<string, InventoryTemplateRecord>();
  private readonly templateItems = new Map<string, TemplateItemRecord>();
  private readonly inventoryItems = new Map<string, InventoryItemRecord>();

  constructor(seedItems?: InventoryItemRecord[]) {
    for (const item of seedItems ?? []) {
      this.inventoryItems.set(item.id, { ...item });
    }
  }

  async createTemplate(template: InventoryTemplateRecord): Promise<InventoryTemplateRecord> {
    this.templates.set(template.id, { ...template });
    return { ...template };
  }

  async listTemplates(): Promise<InventoryTemplateRecord[]> {
    return Array.from(this.templates.values()).map((entry) => ({ ...entry }));
  }

  async findTemplateById(templateId: string): Promise<InventoryTemplateRecord | null> {
    const found = this.templates.get(templateId);
    return found ? { ...found } : null;
  }

  async updateTemplate(template: InventoryTemplateRecord): Promise<InventoryTemplateRecord> {
    this.templates.set(template.id, { ...template });
    return { ...template };
  }

  async createTemplateItem(item: TemplateItemRecord): Promise<TemplateItemRecord> {
    this.templateItems.set(item.id, { ...item });
    return { ...item };
  }

  async findTemplateItemById(templateItemId: string): Promise<TemplateItemRecord | null> {
    const found = this.templateItems.get(templateItemId);
    return found ? { ...found } : null;
  }

  async findTemplateItemByTemplateAndInventoryItem(
    templateId: string,
    inventoryItemId: string
  ): Promise<TemplateItemRecord | null> {
    for (const item of this.templateItems.values()) {
      if (item.templateId === templateId && item.inventoryItemId === inventoryItemId) {
        return { ...item };
      }
    }

    return null;
  }

  async listTemplateItems(templateId: string): Promise<TemplateItemRecord[]> {
    return Array.from(this.templateItems.values())
      .filter((item) => item.templateId === templateId)
      .map((item) => ({ ...item }));
  }

  async updateTemplateItem(item: TemplateItemRecord): Promise<TemplateItemRecord> {
    this.templateItems.set(item.id, { ...item });
    return { ...item };
  }

  async removeTemplateItem(templateItemId: string): Promise<void> {
    this.templateItems.delete(templateItemId);
  }

  async findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null> {
    const found = this.inventoryItems.get(inventoryItemId);
    return found ? { ...found } : null;
  }
}

function createSeedInventoryItems(): InventoryItemRecord[] {
  const now = "2026-11-01T09:00:00.000Z";

  return [
    {
      id: "item_tv_55",
      name: "55-inch Smart TV",
      category: "asset",
      internalCode: "TV-55",
      unitOfMeasure: "piece",
      reorderThreshold: null,
      parLevel: null,
      criticality: "critical",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "item_bath_towel",
      name: "Bath Towel",
      category: "consumable",
      internalCode: "TWL-01",
      unitOfMeasure: "piece",
      reorderThreshold: 20,
      parLevel: 40,
      criticality: "important",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createHarness() {
  const repository = new InMemoryInventoryTemplateRepository(createSeedInventoryItems());
  let sequence = 0;
  const service = new InventoryTemplateService({
    repository,
    now: () => new Date("2026-11-01T10:00:00.000Z"),
    createId: (prefix) => {
      sequence += 1;
      return `${prefix}_${String(sequence).padStart(3, "0")}`;
    },
  });

  return {
    service,
    repository,
  };
}

async function testCreateTemplate(): Promise<void> {
  const { service } = createHarness();

  const created = await service.createTemplate({
    name: "Executive Flat Standard",
    description: "Default executive flat setup",
    flatType: "executive",
  });

  assert.equal(created.id, "template_001");
  assert.equal(created.name, "Executive Flat Standard");
  assert.equal(created.flatType, "executive");
}

async function testListTemplatesSortedByName(): Promise<void> {
  const { service } = createHarness();

  await service.createTemplate({
    name: "Zulu Template",
    description: null,
    flatType: null,
  });

  await service.createTemplate({
    name: "Alpha Template",
    description: null,
    flatType: null,
  });

  const templates = await service.listTemplates();
  assert.equal(templates.length, 2);
  assert.equal(templates[0].name, "Alpha Template");
}

async function testUpdateTemplateMetadata(): Promise<void> {
  const { service } = createHarness();

  const template = await service.createTemplate({
    name: "Executive Flat Standard",
    description: null,
    flatType: "executive",
  });

  const updated = await service.updateTemplate({
    templateId: template.id,
    name: "Executive Standard v2",
    description: "Updated baseline",
    flatType: "executive_plus",
  });

  assert.equal(updated.name, "Executive Standard v2");
  assert.equal(updated.description, "Updated baseline");
  assert.equal(updated.flatType, "executive_plus");
}

async function testAddTemplateItemsWithExpectedQuantities(): Promise<void> {
  const { service } = createHarness();
  const template = await service.createTemplate({
    name: "Executive Flat Standard",
    description: null,
    flatType: "executive",
  });

  const createdItem = await service.addTemplateItem({
    templateId: template.id,
    inventoryItemId: "item_tv_55",
    expectedQuantity: 1,
  });

  assert.equal(createdItem.templateId, template.id);
  assert.equal(createdItem.inventoryItemId, "item_tv_55");
  assert.equal(createdItem.expectedQuantity, 1);

  const listed = await service.listTemplateItems(template.id);
  assert.equal(listed.length, 1);
}

async function testUpdateExpectedQuantityForTemplateItem(): Promise<void> {
  const { service } = createHarness();
  const template = await service.createTemplate({
    name: "Executive Flat Standard",
    description: null,
    flatType: "executive",
  });

  const createdItem = await service.addTemplateItem({
    templateId: template.id,
    inventoryItemId: "item_tv_55",
    expectedQuantity: 1,
  });

  const updatedItem = await service.updateTemplateItemQuantity({
    templateId: template.id,
    templateItemId: createdItem.id,
    expectedQuantity: 3,
  });

  assert.equal(updatedItem.expectedQuantity, 3);
}

async function testRemoveTemplateItem(): Promise<void> {
  const { service } = createHarness();
  const template = await service.createTemplate({
    name: "Executive Flat Standard",
    description: null,
    flatType: "executive",
  });

  const createdItem = await service.addTemplateItem({
    templateId: template.id,
    inventoryItemId: "item_tv_55",
    expectedQuantity: 1,
  });

  await service.removeTemplateItem({
    templateId: template.id,
    templateItemId: createdItem.id,
  });

  const listed = await service.listTemplateItems(template.id);
  assert.equal(listed.length, 0);
}

async function testPreventDuplicateTemplateItemState(): Promise<void> {
  const { service } = createHarness();
  const template = await service.createTemplate({
    name: "Executive Flat Standard",
    description: null,
    flatType: "executive",
  });

  await service.addTemplateItem({
    templateId: template.id,
    inventoryItemId: "item_tv_55",
    expectedQuantity: 1,
  });

  await assert.rejects(
    async () => {
      await service.addTemplateItem({
        templateId: template.id,
        inventoryItemId: "item_tv_55",
        expectedQuantity: 2,
      });
    },
    /already exists/i
  );
}

async function testPreventNonsenseTemplateItemQuantity(): Promise<void> {
  const { service } = createHarness();
  const template = await service.createTemplate({
    name: "Executive Flat Standard",
    description: null,
    flatType: "executive",
  });

  await assert.rejects(
    async () => {
      await service.addTemplateItem({
        templateId: template.id,
        inventoryItemId: "item_tv_55",
        expectedQuantity: 0,
      });
    },
    /positive integer/i
  );
}

async function testRejectMissingInventoryItemReference(): Promise<void> {
  const { service } = createHarness();
  const template = await service.createTemplate({
    name: "Executive Flat Standard",
    description: null,
    flatType: "executive",
  });

  await assert.rejects(
    async () => {
      await service.addTemplateItem({
        templateId: template.id,
        inventoryItemId: "item_missing",
        expectedQuantity: 1,
      });
    },
    /Inventory item not found/i
  );
}

async function run(): Promise<void> {
  await testCreateTemplate();
  await testListTemplatesSortedByName();
  await testUpdateTemplateMetadata();
  await testAddTemplateItemsWithExpectedQuantities();
  await testUpdateExpectedQuantityForTemplateItem();
  await testRemoveTemplateItem();
  await testPreventDuplicateTemplateItemState();
  await testPreventNonsenseTemplateItemQuantity();
  await testRejectMissingInventoryItemReference();

  console.log("inventory-template-service: ok");
}

void run();
