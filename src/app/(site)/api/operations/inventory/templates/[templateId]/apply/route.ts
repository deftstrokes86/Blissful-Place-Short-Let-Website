import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";
import { handleApplyTemplateToFlatRequest } from "@/server/inventory/inventory-template-http";
import { getSharedInventoryTemplateOperationsService } from "@/server/inventory/inventory-template-operations-service-factory";

export const runtime = "nodejs";

interface Context {
  params: Promise<{
    templateId: string;
  }>;
}

export async function POST(request: Request, context: Context) {
  try {
    await requireStaffOrAdminRequest(request);

    const body = await readJsonObject(request);
    const { templateId } = await context.params;
    const service = getSharedInventoryTemplateOperationsService();

    const result = await handleApplyTemplateToFlatRequest(service, {
      templateId,
      flatId: pickString(body, "flatId"),
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "inventory_template_apply_failed");
  }
}
