import { getSharedAdminNotificationsService } from "@/server/notifications/admin-notifications-service-factory";
import { handleListInternalNotificationsRequest } from "@/server/notifications/admin-notifications-http";
import { jsonErrorFromUnknown, jsonSuccess } from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const service = getSharedAdminNotificationsService();
    const url = new URL(request.url);

    const result = await handleListInternalNotificationsRequest(service, {
      limit: url.searchParams.get("limit"),
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "admin_notifications_list_failed");
  }
}
