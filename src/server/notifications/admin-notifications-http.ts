import type { AdminNotificationsService } from "./admin-notifications-service";

export async function handleListInternalNotificationsRequest(
  service: Pick<AdminNotificationsService, "listInternalNotifications">,
  input: { limit: string | null }
) {
  let parsedLimit: number | undefined;

  if (input.limit !== null) {
    if (!/^\d+$/.test(input.limit.trim())) {
      throw new Error("limit must be a positive integer.");
    }

    parsedLimit = Number(input.limit);
  }

  const notifications = await service.listInternalNotifications({
    limit: parsedLimit,
  });

  return { notifications };
}
