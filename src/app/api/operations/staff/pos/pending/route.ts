import { getSharedStaffOperationsService } from "@/server/booking/staff-operations-service-factory";
import { jsonErrorFromUnknown, jsonSuccess } from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const service = getSharedStaffOperationsService();
    const reservations = await service.listPendingPosReservations();

    return jsonSuccess({ reservations });
  } catch (error) {
    return jsonErrorFromUnknown(error, "staff_pos_pending_list_failed");
  }
}
