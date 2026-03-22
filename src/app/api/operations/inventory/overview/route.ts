import { getSharedAdminInventoryService } from "@/server/inventory/admin-inventory-service-factory";
import { handleGetAdminInventoryOverviewRequest } from "@/server/inventory/admin-inventory-http";
import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import { jsonError, jsonErrorFromUnknown, jsonSuccess } from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const service = getSharedAdminInventoryService();
    const result = await handleGetAdminInventoryOverviewRequest(service);

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "admin_inventory_overview_failed");
  }
}
