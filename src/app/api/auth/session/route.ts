import { getSharedAuthService } from "@/server/auth/auth-service-factory";
import {
  handleGetCurrentSessionUserRequest,
  isAuthHttpError,
} from "@/server/auth/auth-http";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const authService = getSharedAuthService();
    const result = await handleGetCurrentSessionUserRequest(authService, request);

    return jsonSuccess(result);
  } catch (error) {
    if (isAuthHttpError(error)) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "auth_session_failed");
  }
}
