"use client";

import { useEffect, useState } from "react";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  submitCreateMaintenanceIssue,
} from "@/lib/admin-inventory-api";
import type { FlatId } from "@/types/booking";
import { buildIssueTitle, type StaffIssueType } from "./staff-worker-view-model";
import { type StaffIssueFormState, StaffIssueSnapshotView } from "./StaffIssueSnapshotView";

interface StaffIssueFormPanelProps {
  initialFlatId?: FlatId;
}

export function StaffIssueFormPanel({ initialFlatId }: StaffIssueFormPanelProps) {
  const [flatOptions, setFlatOptions] = useState<Array<{ id: FlatId; name: string }>>([]);
  const [form, setForm] = useState<StaffIssueFormState>({
    flatId: initialFlatId ?? "mayfair",
    issueType: "supplies_missing",
    severity: "important",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFlats(): Promise<void> {
      try {
        const overview = await fetchAdminInventoryOverview();
        const nextFlats = Array.isArray(overview?.flats) ? overview.flats : [];
        if (!cancelled) {
          setFlatOptions(nextFlats);
          if (initialFlatId) {
            setForm((current) => ({ ...current, flatId: initialFlatId }));
          } else if (nextFlats[0]) {
            setForm((current) => ({ ...current, flatId: nextFlats[0].id }));
          }
        }
      } catch {
        if (!cancelled) {
          setNotice("Unable to load flats.");
        }
      }
    }

    void loadFlats();

    return () => {
      cancelled = true;
    };
  }, [initialFlatId]);

  async function handleSubmit(): Promise<void> {
    if (isSubmitting || form.note.trim().length === 0) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    const title = buildIssueTitle(form.issueType as StaffIssueType);

    try {
      await submitCreateMaintenanceIssue({
        flatId: form.flatId,
        inventoryItemId: null,
        title,
        notes: form.note.trim(),
        severity: form.severity,
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-issue-create"),
      });

      setForm((current) => ({
        ...current,
        note: "",
      }));
      setNotice("Issue submitted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit issue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-readiness-panel">
      {notice ? <div className="booking-inline-note booking-inline-note-soft">{notice}</div> : null}

      <StaffIssueSnapshotView
        flats={flatOptions}
        form={form}
        isSubmitting={isSubmitting}
        onFormChange={setForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
