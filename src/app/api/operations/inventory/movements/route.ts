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
import {
  handleCreateStockMovementRequest,
  handleTransferStockRequest,
} from "@/server/inventory/stock-movement-http";
import { getSharedStockMovementService } from "@/server/inventory/stock-movement-service-factory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const service = getSharedStockMovementService();
    const action = pickString(body, "action");

    if (action === "transfer") {
      const result = await handleTransferStockRequest(service, {
        inventoryItemId: pickString(body, "inventoryItemId"),
        quantity: pickNumber(body, "quantity"),
        fromFlatId: pickOptionalString(body, "fromFlatId"),
        toFlatId: pickOptionalString(body, "toFlatId"),
        reason: pickString(body, "reason"),
        notes: pickOptionalString(body, "notes"),
        actorId: pickOptionalString(body, "actorId"),
      });

      return jsonSuccess(result, 201);
    }

    const result = await handleCreateStockMovementRequest(service, {
      movementType: pickString(body, "movementType"),
      inventoryItemId: pickString(body, "inventoryItemId"),
      quantity: pickNumber(body, "quantity"),
      adjustToQuantity: pickNumber(body, "adjustToQuantity"),
      flatId: pickOptionalString(body, "flatId"),
      reason: pickString(body, "reason"),
      notes: pickOptionalString(body, "notes"),
      actorId: pickOptionalString(body, "actorId"),
    });

    return jsonSuccess(result, 201);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "stock_movement_create_failed");
  }
}
