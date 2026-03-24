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
import { handleCreateInventoryItemRequest } from "@/server/inventory/inventory-item-http";
import { getSharedInventoryItemService } from "@/server/inventory/inventory-item-service-factory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const service = getSharedInventoryItemService();

    const result = await handleCreateInventoryItemRequest(service, {
      name: pickString(body, "name"),
      category: pickString(body, "category"),
      unitOfMeasure: pickString(body, "unitOfMeasure"),
      internalCode: pickOptionalString(body, "internalCode"),
      reorderThreshold: pickNumber(body, "reorderThreshold"),
      parLevel: pickNumber(body, "parLevel"),
      criticality: pickString(body, "criticality"),
    });

    return jsonSuccess(result, 201);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "inventory_item_create_failed");
  }
}
