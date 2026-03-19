import { getSharedAvailabilityService } from "@/server/booking/availability-service-factory";
import {
  parseAvailabilityCheckpointInput,
  parsePaymentMethodInput,
  parseStayDetailsInput,
} from "@/server/http/reservation-payload";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const checkpoint = parseAvailabilityCheckpointInput(body, "checkpoint");
    const stay = parseStayDetailsInput(body, "stay");
    const reservationId = pickString(body, "reservationId") ?? undefined;
    const availabilityService = getSharedAvailabilityService();

    if (checkpoint === "stay_details_entry") {
      const result = await availabilityService.runInitialAvailabilityCheck(stay, reservationId);
      return jsonSuccess({ result });
    }

    if (checkpoint === "pre_hold_request") {
      const paymentMethod = parsePaymentMethodInput(body, "paymentMethod");
      const result = await availabilityService.runPreHoldRecheck(stay, paymentMethod, reservationId);
      return jsonSuccess({ result });
    }

    if (checkpoint === "pre_online_payment_handoff") {
      const result = await availabilityService.runPreCheckoutRecheck(stay, reservationId);
      return jsonSuccess({ result });
    }

    if (checkpoint === "pre_transfer_confirmation") {
      const result = await availabilityService.runPreConfirmationRecheck(stay, "transfer", reservationId);
      return jsonSuccess({ result });
    }

    if (checkpoint === "pre_pos_confirmation") {
      const result = await availabilityService.runPreConfirmationRecheck(stay, "pos", reservationId);
      return jsonSuccess({ result });
    }

    return jsonError("Unsupported checkpoint.", 400, "invalid_request");
  } catch (error) {
    return jsonErrorFromUnknown(error, "availability_check_failed");
  }
}
