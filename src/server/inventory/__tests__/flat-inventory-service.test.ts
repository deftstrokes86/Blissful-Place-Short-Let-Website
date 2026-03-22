import assert from "node:assert/strict";

import {
  FlatInventoryService,
  type FlatInventoryRepository,
} from "../flat-inventory-service";
import type {
  FlatInventoryRecord,
  FlatRecord,
  InventoryItemRecord,
  InventoryTemplateRecord,
  TemplateItemRecord,
} from "../../../types/booking-backend";

class InMemoryFlatInventoryRepository implements FlatInventoryRepository {
  private readonly flats = new Map<FlatRecord["id"], FlatRecord>();
  private readonly inventoryItems = new Map<string, InventoryItemRecord>();
  private readonly templates = new Map<string, InventoryTemplateRecord>();
  private readonly templateItems = new Map<string, TemplateItemRecord>();
  private readonly flatInventory = new Map<string, FlatInventoryRecord>();

  constructor(args: {
    flats: FlatRecord[];
    inventoryItems: InventoryItemRecord[];
    templates: InventoryTemplateRecord[];
    templateItems: TemplateItemRecord[];
    flatInventory?: FlatInventoryRecord[];
  }) {
    for (const flat of args.flats) {
      this.flats.set(flat.id, { ...flat });
    }

    for (const item of args.inventoryItems) {
      this.inventoryItems.set(item.id, { ...item });
    }

    for (const template of args.templates) {
      this.templates.set(template.id, { ...template });
    }

    for (const item of args.templateItems) {
      this.templateItems.set(item.id, { ...item });
    }

    for (const record of args.flatInventory ?? []) {
      this.flatInventory.set(record.id, { ...record });
    }
  }

  async findFlatById(flatId: FlatRecord["id"]): Promise<FlatRecord | null> {
    const found = this.flats.get(flatId);
    return found ? { ...found } : null;
  }

  async findTemplateById(templateId: string): Promise<InventoryTemplateRecord | null> {
    const found = this.templates.get(templateId);
    return found ? { ...found } : null;
  }

  async listTemplateItems(templateId: string): Promise<TemplateItemRecord[]> {
    return Array.from(this.templateItems.values())
      .filter((item) => item.templateId === templateId)
      .map((item) => ({ ...item }));
  }

  async findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null> {
    const found = this.inventoryItems.get(inventoryItemId);
    return found ? { ...found } : null;
  }

  async findFlatInventoryByFlatAndItem(
    flatId: FlatRecord["id"],
    inventoryItemId: string
  ): Promise<FlatInventoryRecord | null> {
    for (const record of this.flatInventory.values()) {
      if (record.flatId === flatId && record.inventoryItemId === inventoryItemId) {
        return { ...record };
      }
    }

    return null;
  }

  async createFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord> {
    this.flatInventory.set(record.id, { ...record });
    return { ...record };
  }

  async updateFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord> {
    this.flatInventory.set(record.id, { ...record });
    return { ...record };
  }

  async listFlatInventory(flatId: FlatRecord["id"]): Promise<FlatInventoryRecord[]> {
    return Array.from(this.flatInventory.values())
      .filter((item) => item.flatId === flatId)
      .sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId))
      .map((item) => ({ ...item }));
  }
}

function createHarness() {
  const now = "2026-11-02T09:00:00.000Z";

  const flats: FlatRecord[] = [
    {
      id: "mayfair",
      name: "Mayfair Suite",
      nightlyRate: 250000,
      maxGuests: 6,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "windsor",
      name: "Windsor Residence",
      nightlyRate: 150000,
      maxGuests: 6,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const inventoryItems: InventoryItemRecord[] = [
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
    {
      id: "item_lamp",
      name: "Bedside Lamp",
      category: "asset",
      internalCode: "LMP-01",
      unitOfMeasure: "piece",
      reorderThreshold: null,
      parLevel: null,
      criticality: "minor",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const templates: InventoryTemplateRecord[] = [
    {
      id: "template_exec",
      name: "Executive Flat Standard",
      description: "Base setup",
      flatType: "executive",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "template_with_duplicate_items",
      name: "Duplicate Template",
      description: "Invalid duplicate template item setup",
      flatType: "executive",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const templateItems: TemplateItemRecord[] = [
    {
      id: "template_item_1",
      templateId: "template_exec",
      inventoryItemId: "item_tv_55",
      expectedQuantity: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "template_item_2",
      templateId: "template_exec",
      inventoryItemId: "item_bath_towel",
      expectedQuantity: 8,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "template_item_duplicate_1",
      templateId: "template_with_duplicate_items",
      inventoryItemId: "item_tv_55",
      expectedQuantity: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "template_item_duplicate_2",
      templateId: "template_with_duplicate_items",
      inventoryItemId: "item_tv_55",
      expectedQuantity: 2,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const existingFlatInventory: FlatInventoryRecord[] = [
    {
      id: "flat_inventory_existing_tv",
      flatId: "mayfair",
      inventoryItemId: "item_tv_55",
      expectedQuantity: 1,
      currentQuantity: 1,
      conditionStatus: "ok",
      notes: "Already verified",
      lastCheckedAt: "2026-10-30T10:00:00.000Z",
      createdAt: "2026-10-15T09:00:00.000Z",
      updatedAt: "2026-10-30T10:00:00.000Z",
    },
    {
      id: "flat_inventory_override_lamp",
      flatId: "mayfair",
      inventoryItemId: "item_lamp",
      expectedQuantity: 2,
      currentQuantity: 1,
      conditionStatus: "needs_replacement",
      notes: "Custom override item",
      lastCheckedAt: "2026-10-28T11:00:00.000Z",
      createdAt: "2026-10-01T09:00:00.000Z",
      updatedAt: "2026-10-28T11:00:00.000Z",
    },
  ];

  const repository = new InMemoryFlatInventoryRepository({
    flats,
    inventoryItems,
    templates,
    templateItems,
    flatInventory: existingFlatInventory,
  });

  let sequence = 0;
  const service = new FlatInventoryService({
    repository,
    now: () => new Date("2026-11-02T10:00:00.000Z"),
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

async function testApplyTemplateToFlat(): Promise<void> {
  const { service } = createHarness();

  const result = await service.applyTemplateToFlat({
    templateId: "template_exec",
    flatId: "mayfair",
  });

  assert.equal(result.flatId, "mayfair");
  assert.equal(result.templateId, "template_exec");
  assert.equal(result.createdCount, 1);
  assert.equal(result.updatedCount, 1);
}

async function testGenerateFlatInventoryExpectationsCorrectly(): Promise<void> {
  const { service } = createHarness();
  await service.applyTemplateToFlat({
    templateId: "template_exec",
    flatId: "mayfair",
  });

  const inventory = await service.loadFlatInventory("mayfair");
  const tv = inventory.find((item) => item.inventoryItemId === "item_tv_55");
  const towels = inventory.find((item) => item.inventoryItemId === "item_bath_towel");

  assert.ok(tv);
  assert.ok(towels);
  assert.equal(tv?.expectedQuantity, 1);
  assert.equal(towels?.expectedQuantity, 8);
  assert.equal(towels?.currentQuantity, 8, "New assignment should initialize current quantity to template expectation.");
}

async function testApplyingTemplateDoesNotRemoveNonTemplateOverrideItems(): Promise<void> {
  const { service } = createHarness();
  await service.applyTemplateToFlat({
    templateId: "template_exec",
    flatId: "mayfair",
  });

  const inventory = await service.loadFlatInventory("mayfair");
  const lampOverride = inventory.find((item) => item.inventoryItemId === "item_lamp");

  assert.ok(lampOverride);
  assert.equal(lampOverride?.expectedQuantity, 2);
  assert.equal(lampOverride?.conditionStatus, "needs_replacement");
}

async function testPreventDuplicateTemplateItemStateDuringApply(): Promise<void> {
  const { service } = createHarness();

  await assert.rejects(
    async () => {
      await service.applyTemplateToFlat({
        templateId: "template_with_duplicate_items",
        flatId: "windsor",
      });
    },
    /duplicate template items/i
  );
}

async function testLoadingFlatInventoryForOneFlatIsScoped(): Promise<void> {
  const { service } = createHarness();
  await service.applyTemplateToFlat({ templateId: "template_exec", flatId: "mayfair" });

  const mayfairInventory = await service.loadFlatInventory("mayfair");
  const windsorInventory = await service.loadFlatInventory("windsor");

  assert.ok(mayfairInventory.length >= 2);
  assert.equal(windsorInventory.length, 0);
}

async function run(): Promise<void> {
  await testApplyTemplateToFlat();
  await testGenerateFlatInventoryExpectationsCorrectly();
  await testApplyingTemplateDoesNotRemoveNonTemplateOverrideItems();
  await testPreventDuplicateTemplateItemStateDuringApply();
  await testLoadingFlatInventoryForOneFlatIsScoped();

  console.log("flat-inventory-service: ok");
}

void run();
