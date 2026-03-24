import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";
import {
  handleClearFlatReadinessOverrideRequest,
  handleSetFlatReadinessOverrideRequest,
} from "@/server/inventory/flat-inventory-reconciliation-http";
import { getSharedFlatInventoryReconciliationOperationsService } from "@/server/inventory/flat-inventory-reconciliation-service-factory";

export const runtime = "nodejs";

interface Context {
  params: Promise<{
    flatId: string;
  }>;
}

export async function POST(request: Request, context: Context) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const { flatId } = await context.params;

    const service = getSharedFlatInventoryReconciliationOperationsService();
    const result = await handleSetFlatReadinessOverrideRequest(service, {
      flatId,
      overrideStatus: pickString(body, "overrideStatus"),
      reason: pickString(body, "reason"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "flat_readiness_override_set_failed");
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    await requireStaffOrAdminRequest(request);

    const { flatId } = await context.params;
    const service = getSharedFlatInventoryReconciliationOperationsService();

    const result = await handleClearFlatReadinessOverrideRequest(service, {
      flatId,
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "flat_readiness_override_clear_failed");
  }
}
