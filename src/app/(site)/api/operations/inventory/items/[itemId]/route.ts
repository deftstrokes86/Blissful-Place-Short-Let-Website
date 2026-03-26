import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickNumber,
  pickOptionalString,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";
import { handleUpdateInventoryItemRequest } from "@/server/inventory/inventory-item-http";
import { getSharedInventoryItemService } from "@/server/inventory/inventory-item-service-factory";

export const runtime = "nodejs";

interface Context {
  params: Promise<{
    itemId: string;
  }>;
}

export async function POST(request: Request, context: Context) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const { itemId } = await context.params;

    const service = getSharedInventoryItemService();
    const result = await handleUpdateInventoryItemRequest(service, {
      itemId,
      name: pickOptionalString(body, "name"),
      category: pickOptionalString(body, "category"),
      unitOfMeasure: pickOptionalString(body, "unitOfMeasure"),
      internalCode: pickOptionalString(body, "internalCode"),
      reorderThreshold: pickNumber(body, "reorderThreshold"),
      parLevel: pickNumber(body, "parLevel"),
      criticality: pickOptionalString(body, "criticality"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "inventory_item_update_failed");
  }
}
