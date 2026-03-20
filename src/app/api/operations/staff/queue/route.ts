import { getSharedStaffOperationsService } from "@/server/booking/staff-operations-service-factory";
import { jsonErrorFromUnknown, jsonSuccess } from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const service = getSharedStaffOperationsService();
    const queues = await service.listPendingQueues();

    return jsonSuccess({ queues });
  } catch (error) {
    return jsonErrorFromUnknown(error, "operations_queue_failed");
  }
}
