"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { submitCreateInventoryItem } from "@/lib/admin-inventory-api";
import {
  AdminInventoryItemCreateSnapshotView,
  type AdminInventoryItemFormState,
} from "./AdminInventoryItemCreateSnapshotView";

function parseOptionalInteger(value: string): number | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to create inventory item right now.";
}

export function AdminInventoryItemCreatePanel() {
  const router = useRouter();

  const [form, setForm] = useState<AdminInventoryItemFormState>({
    name: "",
    category: "asset",
    unitOfMeasure: "piece",
    internalCode: "",
    reorderThreshold: "",
    parLevel: "",
    criticality: "important",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    if (isSubmitting || form.name.trim().length === 0 || form.unitOfMeasure.trim().length === 0) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const created = await submitCreateInventoryItem({
        name: form.name,
        category: form.category,
        unitOfMeasure: form.unitOfMeasure,
        internalCode: form.internalCode.trim().length > 0 ? form.internalCode.trim() : null,
        reorderThreshold: parseOptionalInteger(form.reorderThreshold),
        parLevel: parseOptionalInteger(form.parLevel),
        criticality: form.criticality,
      });

      router.push(`/admin/inventory/items/${created.id}`);
    } catch (error) {
      setNotice(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-inventory-panel">
      {notice ? <div className="booking-inline-note booking-inline-note-muted">{notice}</div> : null}

      <AdminInventoryItemCreateSnapshotView
        form={form}
        isSubmitting={isSubmitting}
        onChange={(field, value) => {
          setForm((current) => ({
            ...current,
            [field]: value,
          }));
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
