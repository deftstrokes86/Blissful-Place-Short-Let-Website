import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import {
  isRecord,
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  readJsonObject,
} from "@/server/http/route-helpers";
import { handleUpdateFlatChecklistReadinessRequest } from "@/server/inventory/readiness-http";
import { getSharedReadinessService } from "@/server/inventory/readiness-service-factory";

export const runtime = "nodejs";

interface Context {
  params: Promise<{
    flatId: string;
  }>;
}

function pickBoolean(source: Record<string, unknown>, key: string): boolean | null {
  const value = source[key];
  if (typeof value !== "boolean") {
    return null;
  }

  return value;
}

export async function POST(request: Request, context: Context) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    if (!isRecord(body)) {
      throw new Error("Request body must be an object.");
    }

    const { flatId } = await context.params;
    const service = getSharedReadinessService();

    const result = await handleUpdateFlatChecklistReadinessRequest(service, {
      flatId,
      cleaningCompleted: pickBoolean(body, "cleaningCompleted"),
      linenCompleted: pickBoolean(body, "linenCompleted"),
      consumablesCompleted: pickBoolean(body, "consumablesCompleted"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "flat_readiness_update_failed");
  }
}
