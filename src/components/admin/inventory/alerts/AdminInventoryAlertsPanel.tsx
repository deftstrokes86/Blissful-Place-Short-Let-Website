"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  submitResolveInventoryAlert,
  type AdminInventoryOverview,
} from "@/lib/admin-inventory-api";
import { AdminInventoryAlertsSnapshotView } from "./AdminInventoryAlertsSnapshotView";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to complete alert action right now.";
}

export function AdminInventoryAlertsPanel() {
  const [overview, setOverview] = useState<AdminInventoryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);

    try {
      const next = await fetchAdminInventoryOverview();
      setOverview(next);
      setNotice(null);
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function handleResolveAlert(alertId: string): Promise<void> {
    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitResolveInventoryAlert({
        alertId,
        note: "Resolved by admin operations workflow.",
        idempotencyKey: createAdminInventoryIdempotencyKey("inventory-alert-resolve"),
      });

      setNotice({ tone: "ok", message: "Alert resolved." });
      await loadOverview();
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-inventory-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Inventory Alerts
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Surface active operational risks and resolve them before they impact readiness.
          </p>
        </div>

        <div className="admin-bookings-toolbar-controls">
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={isLoading || isSubmitting}
            onClick={() => {
              void loadOverview();
            }}
          >
            {isLoading ? "Refreshing..." : "Refresh Alerts"}
          </button>
        </div>
      </section>

      {notice ? (
        <div className={`booking-inline-note ${notice.tone === "ok" ? "booking-inline-note-ok" : "booking-inline-note-muted"}`}>
          {notice.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="booking-inline-note booking-inline-note-soft">Loading alerts...</div>
      ) : !overview ? (
        <div className="booking-inline-note booking-inline-note-muted">Alerts view is unavailable.</div>
      ) : (
        <AdminInventoryAlertsSnapshotView
          alerts={overview.activeAlerts}
          maintenanceIssues={overview.maintenanceIssues}
          isSubmitting={isSubmitting}
          onResolveAlert={handleResolveAlert}
        />
      )}
    </div>
  );
}
