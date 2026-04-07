"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchAdminInventoryOverview,
  type AdminInventoryOverview,
} from "@/lib/admin-inventory-api";
import { AdminInventorySnapshotView } from "./AdminInventorySnapshotView";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to load inventory overview right now.";
}

function formatGeneratedLabel(value: string | null | undefined): string {
  if (!value) {
    return "Not loaded";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export function AdminInventoryPanel() {
  const [overview, setOverview] = useState<AdminInventoryOverview | null>(null);
  const [selectedFlatId, setSelectedFlatId] = useState<string>("mayfair");
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
      const nextFlats = Array.isArray(next?.flats) ? next.flats : [];

      setOverview(next);

      if (!nextFlats.some((flat) => flat.id === selectedFlatId)) {
        setSelectedFlatId(nextFlats[0]?.id ?? "mayfair");
      }

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
  }, [selectedFlatId]);

  useEffect(() => {
    void loadOverview("initial");
  }, [loadOverview]);

  const generatedLabel = useMemo(() => formatGeneratedLabel(overview?.generatedAt), [overview?.generatedAt]);

  return (
    <div className="admin-inventory-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Inventory Control
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Track catalog, templates, flat-level inventory, and movement history from one operational surface.
          </p>
        </div>

        <div className="admin-bookings-toolbar-controls">
          <div>
            <label className="admin-label" htmlFor="inventory-flat-filter">
              Flat Filter
            </label>
            <select
              id="inventory-flat-filter"
              className="standard-input admin-compact-input"
              value={selectedFlatId}
              onChange={(event) => setSelectedFlatId(event.target.value)}
              disabled={!overview || isInitialLoading || isRefreshing}
            >
              {(overview?.flats ?? []).map((flat) => (
                <option key={flat.id} value={flat.id}>
                  {flat.name}
                </option>
              ))}
            </select>
          </div>

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
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </section>

      {loadError && <div className="booking-inline-note booking-inline-note-muted">{loadError}</div>}

      {isInitialLoading ? (
        <div className="booking-inline-note booking-inline-note-soft">Loading inventory operations view...</div>
      ) : overview ? (
        <AdminInventorySnapshotView overview={overview} selectedFlatId={selectedFlatId} />
      ) : (
        <div className="booking-inline-note booking-inline-note-muted">Inventory overview is not available yet.</div>
      )}
    </div>
  );
}
