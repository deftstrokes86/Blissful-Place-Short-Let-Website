import { getSharedAdminInventoryService } from "@/server/inventory/admin-inventory-service-factory";
import { handleResolveInventoryAlertRequest } from "@/server/inventory/admin-inventory-http";
import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickOptionalString,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

interface Context {
  params: Promise<{
    alertId: string;
  }>;
}

export async function POST(request: Request, context: Context) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const { alertId } = await context.params;
    const service = getSharedAdminInventoryService();

    const result = await handleResolveInventoryAlertRequest(service, {
      alertId,
      note: pickOptionalString(body, "note"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "admin_inventory_alert_resolve_failed");
  }
}
