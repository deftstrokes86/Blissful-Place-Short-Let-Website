"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  fetchInventoryTemplateSummaries,
  type AdminInventoryTemplateSummary,
} from "@/lib/admin-inventory-templates-api";
import { AdminInventoryTemplatesSnapshotView } from "./AdminInventoryTemplatesSnapshotView";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to load templates right now.";
}

export function AdminInventoryTemplatesPanel() {
  const [templates, setTemplates] = useState<AdminInventoryTemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);

    try {
      const next = await fetchInventoryTemplateSummaries();
      setTemplates(next);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  return (
    <div className="admin-inventory-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Inventory Templates
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Standardize expected inventory setup by flat type and apply it to operational flats.
          </p>
        </div>

        <div className="admin-bookings-toolbar-controls">
          <Link href="/admin/inventory/templates/new" className="btn btn-primary">
            New Template
          </Link>
          <button type="button" className="btn btn-outline-primary" onClick={() => void loadTemplates()} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {errorMessage ? <div className="booking-inline-note booking-inline-note-muted">{errorMessage}</div> : null}

      {isLoading ? (
        <div className="booking-inline-note booking-inline-note-soft">Loading templates...</div>
      ) : (
        <AdminInventoryTemplatesSnapshotView templates={templates} />
      )}
    </div>
  );
}
