import { getSharedStaffOperationsService } from "@/server/booking/staff-operations-service-factory";
import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import { jsonError, jsonErrorFromUnknown, jsonSuccess } from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const service = getSharedStaffOperationsService();
    const reservations = await service.listPendingTransferReservations();

    return jsonSuccess({ reservations });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "staff_transfer_pending_list_failed");
  }
}
