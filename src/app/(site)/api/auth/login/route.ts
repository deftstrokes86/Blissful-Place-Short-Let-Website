import { getSharedAuthService } from "@/server/auth/auth-service-factory";
import {
  handleLoginRequest,
  isAuthHttpError,
} from "@/server/auth/auth-http";
import {
  createAuthSessionSetCookieHeader,
} from "@/server/auth/session-cookie";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const authService = getSharedAuthService();

    const result = await handleLoginRequest(authService, body);

    const response = jsonSuccess({
      user: result.user,
      redirectTo: result.redirectTo,
    });

    response.headers.append(
      "Set-Cookie",
      createAuthSessionSetCookieHeader({
        sessionToken: result.sessionToken,
        expiresAt: result.expiresAt,
      })
    );

    return response;
  } catch (error) {
    if (isAuthHttpError(error)) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "auth_login_failed");
  }
}
