import { AuthorizationError } from "@/server/auth/require-auth";
import { requireStaffOrAdminRequest } from "@/server/auth/require-role";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
} from "@/server/http/route-helpers";
import { handleRemoveTemplateItemRequest } from "@/server/inventory/inventory-template-http";
import { getSharedInventoryTemplateOperationsService } from "@/server/inventory/inventory-template-operations-service-factory";

export const runtime = "nodejs";

interface Context {
  params: Promise<{
    templateId: string;
    templateItemId: string;
  }>;
}

export async function POST(request: Request, context: Context) {
  try {
    await requireStaffOrAdminRequest(request);

    const { templateId, templateItemId } = await context.params;
    const service = getSharedInventoryTemplateOperationsService();

    const result = await handleRemoveTemplateItemRequest(service, {
      templateId,
      templateItemId,
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonErrorFromUnknown(error, "inventory_template_item_remove_failed");
  }
}
