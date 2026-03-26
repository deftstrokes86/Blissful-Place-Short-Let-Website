import {
  handleCreateManualBlockRequest,
  handleListManualBlocksRequest,
} from "@/server/booking/staff-operations-http";
import { getSharedOperationsService } from "@/server/booking/operations-service-factory";
import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickIdempotencyKey,
  pickOptionalString,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const url = new URL(request.url);
    const service = getSharedOperationsService();

    const result = await handleListManualBlocksRequest(service, {
      flatId: url.searchParams.get("flatId"),
      includeReleased: url.searchParams.get("includeReleased"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "manual_block_list_failed");
  }
}

export async function POST(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const service = getSharedOperationsService();

    const result = await handleCreateManualBlockRequest(service, {
      flatId: pickString(body, "flatId"),
      startDate: pickString(body, "startDate"),
      endDate: pickString(body, "endDate"),
      manualBlockType: pickString(body, "manualBlockType"),
      reason: pickString(body, "reason"),
      notes: pickOptionalString(body, "notes"),
      createdBy: pickOptionalString(body, "createdBy"),
      expiresAt: pickOptionalString(body, "expiresAt"),
      idempotencyKey: pickIdempotencyKey(request, body),
    });

    return jsonSuccess(result, 201);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "manual_block_create_failed");
  }
}
