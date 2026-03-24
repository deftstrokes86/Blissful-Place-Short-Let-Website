import assert from "node:assert/strict";

import {
  fetchInventoryTemplate,
  fetchInventoryTemplateSummaries,
  submitAddInventoryTemplateItem,
  submitApplyInventoryTemplateToFlat,
  submitCreateInventoryTemplate,
  submitRemoveInventoryTemplateItem,
  submitUpdateInventoryTemplate,
  submitUpdateInventoryTemplateItemQuantity,
} from "../../../lib/admin-inventory-templates-api";

function createApiSuccess<T>(data: T): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      data,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

async function testTemplateListAndDetailRequests(): Promise<void> {
  const originalFetch = globalThis.fetch;
  const captured: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    captured.push(url);

    if (url.endsWith("/templates")) {
      return createApiSuccess({
        templates: [
          {
            template: {
              id: "template_1",
              name: "Executive Standard",
              description: null,
              flatType: "suite",
              createdAt: "2026-11-20T10:00:00.000Z",
              updatedAt: "2026-11-20T10:00:00.000Z",
            },
            itemCount: 2,
          },
        ],
      });
    }

    return createApiSuccess({
      template: {
        id: "template_1",
        name: "Executive Standard",
        description: null,
        flatType: "suite",
        createdAt: "2026-11-20T10:00:00.000Z",
        updatedAt: "2026-11-20T10:00:00.000Z",
      },
      items: [],
    });
  }) as typeof fetch;

  try {
    const templates = await fetchInventoryTemplateSummaries();
    const detail = await fetchInventoryTemplate("template_1");

    assert.equal(templates.length, 1);
    assert.equal(templates[0].itemCount, 2);
    assert.equal(detail.template.id, "template_1");
    assert.ok(captured.some((value) => value.includes("/api/operations/inventory/templates")));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testTemplateMutationsRequestShapes(): Promise<void> {
  const originalFetch = globalThis.fetch;
  const captured: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({ url: String(input), init });

    return createApiSuccess({
      template: {
        id: "template_1",
      },
      templateItem: {
        id: "template_item_1",
      },
      ok: true,
      result: {
        templateId: "template_1",
        flatId: "mayfair",
        createdCount: 1,
        updatedCount: 1,
        totalTemplateItems: 2,
      },
    });
  }) as typeof fetch;

  try {
    await submitCreateInventoryTemplate({
      name: "Executive Standard",
      description: "Default setup",
      flatType: "suite",
    });

    await submitUpdateInventoryTemplate({
      templateId: "template_1",
      name: "Executive Standard v2",
      description: "Updated",
      flatType: "suite_plus",
    });

    await submitAddInventoryTemplateItem({
      templateId: "template_1",
      inventoryItemId: "item_tv",
      expectedQuantity: 1,
    });

    await submitUpdateInventoryTemplateItemQuantity({
      templateId: "template_1",
      templateItemId: "template_item_1",
      expectedQuantity: 3,
    });

    await submitRemoveInventoryTemplateItem({
      templateId: "template_1",
      templateItemId: "template_item_1",
    });

    await submitApplyInventoryTemplateToFlat({
      templateId: "template_1",
      flatId: "mayfair",
    });

    assert.ok(captured.some((entry) => entry.url.endsWith("/api/operations/inventory/templates")));
    assert.ok(captured.some((entry) => entry.url.endsWith("/api/operations/inventory/templates/template_1")));
    assert.ok(captured.some((entry) => entry.url.endsWith("/api/operations/inventory/templates/template_1/items")));
    assert.ok(
      captured.some((entry) =>
        entry.url.endsWith("/api/operations/inventory/templates/template_1/items/template_item_1/quantity")
      )
    );
    assert.ok(
      captured.some((entry) =>
        entry.url.endsWith("/api/operations/inventory/templates/template_1/items/template_item_1/remove")
      )
    );
    assert.ok(captured.some((entry) => entry.url.endsWith("/api/operations/inventory/templates/template_1/apply")));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function run(): Promise<void> {
  await testTemplateListAndDetailRequests();
  await testTemplateMutationsRequestShapes();

  console.log("admin-inventory-templates-api: ok");
}

void run();
