import type { AdminNotificationListItem } from "../../../lib/admin-notifications-api";

import {
  formatAudienceLabel,
  formatChannelLabel,
  formatLagosDateTime,
  formatNotificationEventLabel,
  formatNotificationStatusLabel,
  getDeliveryDetail,
  getNotificationStatusClassName,
  summarizeNotification,
} from "./admin-notifications-view-model";

interface AdminNotificationsListProps {
  notifications: AdminNotificationListItem[];
  isLoading: boolean;
  loadError: string | null;
}

export function AdminNotificationsList(input: AdminNotificationsListProps) {
  if (input.isLoading) {
    return <p className="text-secondary">Loading notifications...</p>;
  }

  return (
    <section className="admin-bookings-section" aria-labelledby="admin-notifications-heading">
      <div className="admin-bookings-section-header">
        <h3 id="admin-notifications-heading" className="heading-sm" style={{ margin: 0 }}>
          Internal Notification Log
        </h3>
        <span className="admin-count-pill">{input.notifications.length} items</span>
      </div>

      {input.loadError && <div className="booking-inline-note booking-inline-note-muted">{input.loadError}</div>}

      {input.notifications.length === 0 ? (
        <p className="text-secondary">No internal notifications yet.</p>
      ) : (
        <div className="admin-bookings-list">
          {input.notifications.map((notification) => {
            const statusLabel = formatNotificationStatusLabel(notification.status);

            return (
              <article key={notification.id} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <div>
                    <p className="admin-card-title">{notification.title}</p>
                    <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                      {formatNotificationEventLabel(notification.eventType)}
                    </p>
                  </div>

                  <span className={getNotificationStatusClassName(notification.status)}>{statusLabel}</span>
                </div>

                <p className="admin-notification-summary">{summarizeNotification(notification)}</p>

                <div className="admin-notifications-meta-grid">
                  <div>
                    <p className="admin-meta-label">Audience</p>
                    <p>{formatAudienceLabel(notification.audience)}</p>
                  </div>

                  <div>
                    <p className="admin-meta-label">Channel</p>
                    <p>{formatChannelLabel(notification.channel)}</p>
                  </div>

                  <div>
                    <p className="admin-meta-label">Reservation</p>
                    <p>{notification.reservationId ?? "-"}</p>
                  </div>

                  <div>
                    <p className="admin-meta-label">Created</p>
                    <p>{formatLagosDateTime(notification.createdAt)}</p>
                  </div>

                  <div>
                    <p className="admin-meta-label">Delivery</p>
                    <p>{getDeliveryDetail(notification)}</p>
                  </div>
                </div>

                {notification.status === "failed" && (
                  <p className="admin-notification-failed">{getDeliveryDetail(notification)}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
