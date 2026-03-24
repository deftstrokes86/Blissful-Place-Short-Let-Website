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
import {
  handleCreateTemplateRequest,
  handleListTemplatesRequest,
} from "@/server/inventory/inventory-template-http";
import { getSharedInventoryTemplateOperationsService } from "@/server/inventory/inventory-template-operations-service-factory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const service = getSharedInventoryTemplateOperationsService();
    const result = await handleListTemplatesRequest(service);

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "inventory_template_list_failed");
  }
}

export async function POST(request: Request) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const service = getSharedInventoryTemplateOperationsService();

    const result = await handleCreateTemplateRequest(service, {
      name: pickString(body, "name"),
      description: pickOptionalString(body, "description"),
      flatType: pickOptionalString(body, "flatType"),
    });

    return jsonSuccess(result, 201);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "inventory_template_create_failed");
  }
}
