import { getSharedAdminInventoryService } from "@/server/inventory/admin-inventory-service-factory";
import { handleCreateMaintenanceIssueRequest } from "@/server/inventory/admin-inventory-http";
import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickOptionalString,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const service = getSharedAdminInventoryService();

    const result = await handleCreateMaintenanceIssueRequest(service, {
      flatId: pickString(body, "flatId"),
      inventoryItemId: pickOptionalString(body, "inventoryItemId"),
      title: pickString(body, "title"),
      notes: pickOptionalString(body, "notes"),
      severity: pickString(body, "severity"),
    });

    return jsonSuccess(result, 201);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "admin_inventory_issue_create_failed");
  }
}
