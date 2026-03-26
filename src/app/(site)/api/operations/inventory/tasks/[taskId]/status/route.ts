import { getSharedWorkerTaskService } from "@/server/inventory/worker-task-service-factory";
import { handleUpdateWorkerTaskStatusRequest } from "@/server/inventory/worker-task-http";
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
    taskId: string;
  }>;
}

export async function POST(request: Request, context: Context) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const { taskId } = await context.params;
    const service = getSharedWorkerTaskService();

    const result = await handleUpdateWorkerTaskStatusRequest(service, {
      taskId,
      status: pickString(body, "status"),
      assignedTo: pickOptionalString(body, "assignedTo"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "inventory_task_status_update_failed");
  }
}
