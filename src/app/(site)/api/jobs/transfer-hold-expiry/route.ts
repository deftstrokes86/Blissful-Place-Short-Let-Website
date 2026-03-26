import {
  jsonErrorFromUnknown,
  jsonSuccess,
  pickNumber,
  readJsonObject,
} from "@/server/http/route-helpers";
import { runTransferHoldExpiryJob } from "@/server/jobs/transfer-hold-expiry-job";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const nowMs = pickNumber(body, "nowMs") ?? Date.now();

    const result = await runTransferHoldExpiryJob(nowMs);
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "transfer_hold_expiry_job_failed");
  }
}
