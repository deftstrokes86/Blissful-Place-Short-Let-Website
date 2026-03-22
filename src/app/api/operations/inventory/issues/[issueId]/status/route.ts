import { getSharedAdminInventoryService } from "@/server/inventory/admin-inventory-service-factory";
import { handleUpdateMaintenanceIssueStatusRequest } from "@/server/inventory/admin-inventory-http";
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

interface Context {
  params: Promise<{
    issueId: string;
  }>;
}

export async function POST(request: Request, context: Context) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const { issueId } = await context.params;
    const service = getSharedAdminInventoryService();

    const result = await handleUpdateMaintenanceIssueStatusRequest(service, {
      issueId,
      status: pickString(body, "status"),
      notes: pickOptionalString(body, "notes"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "admin_inventory_issue_status_update_failed");
  }
}
