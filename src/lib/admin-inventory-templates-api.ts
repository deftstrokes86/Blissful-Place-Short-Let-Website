import type { FlatId } from "@/types/booking";
import type { InventoryTemplateRecord, TemplateItemRecord } from "@/types/booking-backend";

interface ApiErrorShape {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

interface ApiSuccessShape<T> {
  ok: true;
  data: T;
}

type ApiResponseShape<T> = ApiErrorShape | ApiSuccessShape<T>;

async function readJsonResponse<T>(response: Response): Promise<T> {
  let payload: ApiResponseShape<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponseShape<T>;
  } catch {
    throw new Error("Request failed. Please try again.");
  }

  if (!payload) {
    throw new Error("Request failed. Please try again.");
  }

  if (!response.ok || !payload.ok) {
    if (!payload.ok) {
      throw new Error(payload.error.message);
    }

    throw new Error("Request failed. Please try again.");
  }

  return payload.data;
}

export interface AdminInventoryTemplateSummary extends InventoryTemplateRecord {
  itemCount: number;
}

export async function fetchInventoryTemplateSummaries(): Promise<AdminInventoryTemplateSummary[]> {
  const response = await fetch("/api/operations/inventory/templates", {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonResponse<{
    templates: Array<{
      template: InventoryTemplateRecord;
      itemCount: number;
    }>;
  }>(response);

  return payload.templates.map((entry) => ({
    ...entry.template,
    itemCount: entry.itemCount,
  }));
}

export async function fetchInventoryTemplate(templateId: string): Promise<{
  template: InventoryTemplateRecord;
  items: TemplateItemRecord[];
}> {
  const response = await fetch(`/api/operations/inventory/templates/${encodeURIComponent(templateId)}`, {
    method: "GET",
    cache: "no-store",
  });

  return readJsonResponse<{ template: InventoryTemplateRecord; items: TemplateItemRecord[] }>(response);
}

export async function submitCreateInventoryTemplate(input: {
  name: string;
  description: string | null;
  flatType: string | null;
}): Promise<InventoryTemplateRecord> {
  const response = await fetch("/api/operations/inventory/templates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      flatType: input.flatType,
    }),
  });

  const payload = await readJsonResponse<{ template: InventoryTemplateRecord }>(response);
  return payload.template;
}

export async function submitUpdateInventoryTemplate(input: {
  templateId: string;
  name: string;
  description: string | null;
  flatType: string | null;
}): Promise<InventoryTemplateRecord> {
  const response = await fetch(`/api/operations/inventory/templates/${encodeURIComponent(input.templateId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      flatType: input.flatType,
    }),
  });

  const payload = await readJsonResponse<{ template: InventoryTemplateRecord }>(response);
  return payload.template;
}

export async function submitAddInventoryTemplateItem(input: {
  templateId: string;
  inventoryItemId: string;
  expectedQuantity: number;
}): Promise<TemplateItemRecord> {
  const response = await fetch(`/api/operations/inventory/templates/${encodeURIComponent(input.templateId)}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inventoryItemId: input.inventoryItemId,
      expectedQuantity: input.expectedQuantity,
    }),
  });

  const payload = await readJsonResponse<{ templateItem: TemplateItemRecord }>(response);
  return payload.templateItem;
}

export async function submitUpdateInventoryTemplateItemQuantity(input: {
  templateId: string;
  templateItemId: string;
  expectedQuantity: number;
}): Promise<TemplateItemRecord> {
  const response = await fetch(
    `/api/operations/inventory/templates/${encodeURIComponent(input.templateId)}/items/${encodeURIComponent(input.templateItemId)}/quantity`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expectedQuantity: input.expectedQuantity,
      }),
    }
  );

  const payload = await readJsonResponse<{ templateItem: TemplateItemRecord }>(response);
  return payload.templateItem;
}

export async function submitRemoveInventoryTemplateItem(input: {
  templateId: string;
  templateItemId: string;
}): Promise<void> {
  const response = await fetch(
    `/api/operations/inventory/templates/${encodeURIComponent(input.templateId)}/items/${encodeURIComponent(input.templateItemId)}/remove`,
    {
      method: "POST",
    }
  );

  await readJsonResponse<{ ok: true }>(response);
}

export async function submitApplyInventoryTemplateToFlat(input: {
  templateId: string;
  flatId: FlatId;
}): Promise<{
  templateId: string;
  flatId: FlatId;
  createdCount: number;
  updatedCount: number;
  totalTemplateItems: number;
}> {
  const response = await fetch(`/api/operations/inventory/templates/${encodeURIComponent(input.templateId)}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      flatId: input.flatId,
    }),
  });

  const payload = await readJsonResponse<{
    result: {
      templateId: string;
      flatId: FlatId;
      createdCount: number;
      updatedCount: number;
      totalTemplateItems: number;
    };
  }>(response);

  return payload.result;
}
