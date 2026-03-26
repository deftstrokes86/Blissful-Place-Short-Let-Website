import { getSharedAdminNotificationsService } from "@/server/notifications/admin-notifications-service-factory";
import { handleListInternalNotificationsRequest } from "@/server/notifications/admin-notifications-http";
import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import { jsonError, jsonErrorFromUnknown, jsonSuccess } from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const service = getSharedAdminNotificationsService();
    const url = new URL(request.url);

    const result = await handleListInternalNotificationsRequest(service, {
      limit: url.searchParams.get("limit"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "admin_notifications_list_failed");
  }
}
