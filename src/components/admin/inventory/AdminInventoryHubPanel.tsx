"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchAdminInventoryOverview,
  type AdminInventoryOverview,
} from "@/lib/admin-inventory-api";
import { AdminInventoryHubSnapshotView } from "./AdminInventoryHubSnapshotView";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to load inventory hub right now.";
}

export function AdminInventoryHubPanel() {
  const [overview, setOverview] = useState<AdminInventoryOverview | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOverview = useCallback(async (mode: "initial" | "refresh"): Promise<void> => {
    if (mode === "initial") {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const next = await fetchAdminInventoryOverview();
      setOverview(next);
      setLoadError(null);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      if (mode === "initial") {
        setIsInitialLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadOverview("initial");
  }, [loadOverview]);

  const generatedLabel = useMemo(() => {
    if (!overview) {
      return "Not loaded";
    }

    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(new Date(overview.generatedAt));
  }, [overview]);

  return (
    <div className="admin-inventory-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Operations Navigation
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Use this hub to route supervisors to the exact inventory workflow they need.
          </p>
        </div>

        <div className="admin-bookings-toolbar-controls">
          <div>
            <p className="admin-meta-label">Last Updated</p>
            <p className="text-secondary" style={{ fontSize: "0.86rem" }}>{generatedLabel}</p>
          </div>

          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={isInitialLoading || isRefreshing}
            onClick={() => void loadOverview("refresh")}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Hub"}
          </button>
        </div>
      </section>

      {loadError ? <div className="booking-inline-note booking-inline-note-muted">{loadError}</div> : null}

      {isInitialLoading ? (
        <div className="booking-inline-note booking-inline-note-soft">Loading inventory hub...</div>
      ) : overview ? (
        <AdminInventoryHubSnapshotView overview={overview} />
      ) : (
        <div className="booking-inline-note booking-inline-note-muted">Inventory hub is not available yet.</div>
      )}
    </div>
  );
}
