import {
  AdminNotificationsService,
  fileAdminNotificationsQueryRepository,
} from "./admin-notifications-service";

let sharedAdminNotificationsService: AdminNotificationsService | null = null;

export function getSharedAdminNotificationsService(): AdminNotificationsService {
  if (sharedAdminNotificationsService) {
    return sharedAdminNotificationsService;
  }

  sharedAdminNotificationsService = new AdminNotificationsService({
    repository: fileAdminNotificationsQueryRepository,
  });

  return sharedAdminNotificationsService;
}
