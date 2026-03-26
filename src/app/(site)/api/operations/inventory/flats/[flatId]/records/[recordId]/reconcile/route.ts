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
import { handleReconcileFlatInventoryRecordRequest } from "@/server/inventory/flat-inventory-reconciliation-http";
import { getSharedFlatInventoryReconciliationOperationsService } from "@/server/inventory/flat-inventory-reconciliation-service-factory";

export const runtime = "nodejs";

interface Context {
  params: Promise<{
    flatId: string;
    recordId: string;
  }>;
}

export async function POST(request: Request, context: Context) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const { flatId, recordId } = await context.params;

    const service = getSharedFlatInventoryReconciliationOperationsService();
    const result = await handleReconcileFlatInventoryRecordRequest(service, {
      flatId,
      flatInventoryId: recordId,
      action: pickString(body, "action"),
      quantity: pickNumber(body, "quantity"),
      note: pickOptionalString(body, "note"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "flat_inventory_reconcile_failed");
  }
}
