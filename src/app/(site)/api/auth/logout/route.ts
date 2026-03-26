import { getSharedAuthService } from "@/server/auth/auth-service-factory";
import {
  handleLogoutRequest,
} from "@/server/auth/auth-http";
import {
  createClearedAuthSessionCookieHeader,
} from "@/server/auth/session-cookie";
import {
  jsonErrorFromUnknown,
  jsonSuccess,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authService = getSharedAuthService();
    await handleLogoutRequest(authService, request);

    const response = jsonSuccess({ success: true });
    response.headers.append("Set-Cookie", createClearedAuthSessionCookieHeader());

    return response;
  } catch (error) {
    return jsonErrorFromUnknown(error, "auth_logout_failed");
  }
}
