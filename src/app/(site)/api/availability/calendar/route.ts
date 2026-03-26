import { getSharedCalendarAvailabilityService } from "@/server/booking/calendar-availability-service-factory";
import { jsonError, jsonErrorFromUnknown, jsonSuccess } from "@/server/http/route-helpers";
import type { FlatId } from "@/types/booking";

export const runtime = "nodejs";

const FLAT_IDS: readonly FlatId[] = ["windsor", "kensington", "mayfair"];

function parseFlatId(value: string | null): FlatId | null {
  if (!value) {
    return null;
  }

  return FLAT_IDS.includes(value as FlatId) ? (value as FlatId) : null;
}

function parseInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const flatId = parseFlatId(url.searchParams.get("flatId"));
    const year = parseInteger(url.searchParams.get("year"));
    const month = parseInteger(url.searchParams.get("month"));

    if (!flatId) {
      return jsonError("A valid flatId is required.", 400, "invalid_request");
    }

    if (!year || year < 1970 || year > 9999) {
      return jsonError("A valid year is required.", 400, "invalid_request");
    }

    if (!month || month < 1 || month > 12) {
      return jsonError("A valid month is required.", 400, "invalid_request");
    }

    const service = getSharedCalendarAvailabilityService();
    const monthResult = await service.queryBlockedDatesForMonth({
      flatId,
      year,
      month,
    });

    return jsonSuccess({ month: monthResult });
  } catch (error) {
    return jsonErrorFromUnknown(error, "availability_calendar_failed");
  }
}

