import assert from "node:assert/strict";

import {
  handleAddTemplateItemRequest,
  handleApplyTemplateToFlatRequest,
  handleCreateTemplateRequest,
  handleRemoveTemplateItemRequest,
  handleUpdateTemplateItemQuantityRequest,
  handleUpdateTemplateRequest,
} from "../inventory-template-http";
import type { InventoryTemplateOperationsService } from "../inventory-template-http";
import type { InventoryTemplateRecord, TemplateItemRecord } from "../../../types/booking-backend";

class StubInventoryTemplateOperationsService implements InventoryTemplateOperationsService {
  async listTemplates() {
    return [];
  }

  async getTemplate(templateId: string) {
    return {
      template: createTemplate(templateId),
      items: [],
    };
  }

  async createTemplate(input: {
    name: string;
    description?: string | null;
    flatType?: string | null;
  }): Promise<InventoryTemplateRecord> {
    return createTemplate("template_created", input);
  }

  async updateTemplate(input: {
    templateId: string;
    name?: string | null;
    description?: string | null;
    flatType?: string | null;
  }): Promise<InventoryTemplateRecord> {
    return createTemplate(input.templateId, {
      name: input.name ?? "Updated Name",
      description: input.description ?? null,
      flatType: input.flatType ?? null,
    });
  }

  async addTemplateItem(input: {
    templateId: string;
    inventoryItemId: string;
    expectedQuantity: number;
  }): Promise<TemplateItemRecord> {
    return createTemplateItem(input.templateId, input.inventoryItemId, input.expectedQuantity);
  }

  async updateTemplateItemQuantity(input: {
    templateId: string;
    templateItemId: string;
    expectedQuantity: number;
  }): Promise<TemplateItemRecord> {
    return {
      ...createTemplateItem(input.templateId, "item_tv", input.expectedQuantity),
      id: input.templateItemId,
    };
  }

  async removeTemplateItem(_input: { templateId: string; templateItemId: string }): Promise<void> {
    return;
  }

  async applyTemplateToFlat(input: { templateId: string; flatId: "windsor" | "kensington" | "mayfair" }) {
    return {
      templateId: input.templateId,
      flatId: input.flatId,
      createdCount: 2,
      updatedCount: 1,
      totalTemplateItems: 3,
    };
  }
}

function createTemplate(
  id: string,
  input?: { name?: string; description?: string | null; flatType?: string | null }
): InventoryTemplateRecord {
  return {
    id,
    name: input?.name ?? "Template Name",
    description: input?.description ?? "Template Description",
    flatType: input?.flatType ?? "suite",
    createdAt: "2026-11-20T09:00:00.000Z",
    updatedAt: "2026-11-20T09:00:00.000Z",
  };
}

function createTemplateItem(templateId: string, inventoryItemId: string, expectedQuantity: number): TemplateItemRecord {
  return {
    id: "template_item_1",
    templateId,
    inventoryItemId,
    expectedQuantity,
    createdAt: "2026-11-20T09:00:00.000Z",
    updatedAt: "2026-11-20T09:00:00.000Z",
  };
}

async function testCreateTemplateValidationAndDelegation(): Promise<void> {
  const service = new StubInventoryTemplateOperationsService();

  await assert.rejects(
    async () => {
      await handleCreateTemplateRequest(service, {
        name: null,
        description: null,
        flatType: null,
      });
    },
    /name is required/i
  );

  const result = await handleCreateTemplateRequest(service, {
    name: " Executive Standard ",
    description: " Base setup ",
    flatType: " suite ",
  });

  assert.equal(result.template.name, "Executive Standard");
  assert.equal(result.template.description, "Base setup");
  assert.equal(result.template.flatType, "suite");
}

async function testTemplateItemAddRemoveAndEditValidation(): Promise<void> {
  const service = new StubInventoryTemplateOperationsService();

  await assert.rejects(
    async () => {
      await handleAddTemplateItemRequest(service, {
        templateId: "template_1",
        inventoryItemId: null,
        expectedQuantity: 1,
      });
    },
    /inventoryItemId/i
  );

  const added = await handleAddTemplateItemRequest(service, {
    templateId: "template_1",
    inventoryItemId: "item_tv",
    expectedQuantity: 2,
  });

  assert.equal(added.templateItem.expectedQuantity, 2);

  const updated = await handleUpdateTemplateItemQuantityRequest(service, {
    templateId: "template_1",
    templateItemId: "template_item_1",
    expectedQuantity: 5,
  });

  assert.equal(updated.templateItem.expectedQuantity, 5);

  const removed = await handleRemoveTemplateItemRequest(service, {
    templateId: "template_1",
    templateItemId: "template_item_1",
  });

  assert.equal(removed.ok, true);
}

async function testUpdateTemplateAndApplyFlowValidation(): Promise<void> {
  const service = new StubInventoryTemplateOperationsService();

  await assert.rejects(
    async () => {
      await handleUpdateTemplateRequest(service, {
        templateId: "",
        name: "Name",
        description: null,
        flatType: null,
      });
    },
    /templateId is required/i
  );

  const updated = await handleUpdateTemplateRequest(service, {
    templateId: "template_1",
    name: " Template v2 ",
    description: " Revised ",
    flatType: " suite_plus ",
  });

  assert.equal(updated.template.name, "Template v2");

  await assert.rejects(
    async () => {
      await handleApplyTemplateToFlatRequest(service, {
        templateId: "template_1",
        flatId: "invalid-flat",
      });
    },
    /valid flatId/i
  );

  const applied = await handleApplyTemplateToFlatRequest(service, {
    templateId: "template_1",
    flatId: "mayfair",
  });

  assert.equal(applied.result.totalTemplateItems, 3);
}

async function run(): Promise<void> {
  await testCreateTemplateValidationAndDelegation();
  await testTemplateItemAddRemoveAndEditValidation();
  await testUpdateTemplateAndApplyFlowValidation();

  console.log("inventory-template-http: ok");
}

void run();
