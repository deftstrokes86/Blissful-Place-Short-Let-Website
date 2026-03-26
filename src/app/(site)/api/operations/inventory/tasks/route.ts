import { getSharedWorkerTaskService } from "@/server/inventory/worker-task-service-factory";
import {
  handleCreateWorkerTaskRequest,
  handleListWorkerTasksRequest,
} from "@/server/inventory/worker-task-http";
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

export async function GET(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const url = new URL(request.url);
    const service = getSharedWorkerTaskService();

    const result = await handleListWorkerTasksRequest(service, {
      flatId: url.searchParams.get("flatId"),
      status: url.searchParams.get("status"),
      sync: url.searchParams.get("sync"),
      openOnly: url.searchParams.get("openOnly"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "inventory_task_list_failed");
  }
}

export async function POST(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const service = getSharedWorkerTaskService();

    const result = await handleCreateWorkerTaskRequest(service, {
      flatId: pickString(body, "flatId"),
      title: pickString(body, "title"),
      description: pickOptionalString(body, "description"),
      taskType: pickString(body, "taskType"),
      priority: pickString(body, "priority"),
      assignedTo: pickOptionalString(body, "assignedTo"),
    });

    return jsonSuccess(result, 201);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "inventory_task_create_failed");
  }
}
