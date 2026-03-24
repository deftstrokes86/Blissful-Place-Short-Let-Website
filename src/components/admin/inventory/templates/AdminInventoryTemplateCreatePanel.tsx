"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { submitCreateInventoryTemplate } from "@/lib/admin-inventory-templates-api";
import { isCreateTemplateDisabled } from "./admin-template-editor-view-model";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to create template right now.";
}

export function AdminInventoryTemplateCreatePanel() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [flatType, setFlatType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const disabled = isCreateTemplateDisabled({
    isSubmitting,
    name,
  });

  async function handleCreateTemplate(): Promise<void> {
    if (disabled) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const created = await submitCreateInventoryTemplate({
        name,
        description: description.trim() || null,
        flatType: flatType.trim() || null,
      });

      router.push(`/admin/inventory/templates/${created.id}`);
    } catch (error) {
      setNotice(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <section className="admin-bookings-section" aria-labelledby="template-create-heading">
      <div className="admin-bookings-section-header">
        <h2 id="template-create-heading" className="heading-sm" style={{ margin: 0 }}>
          Create Inventory Template
        </h2>
        <span className="admin-count-pill">Guided Setup</span>
      </div>

      <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
        Start with template metadata. After creation, add expected item quantities and apply the template to flats.
      </p>

      {notice ? <div className="booking-inline-note booking-inline-note-muted">{notice}</div> : null}

      <form
        className="admin-form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreateTemplate();
        }}
      >
        <input
          className="standard-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Template name"
          disabled={isSubmitting}
        />

        <input
          className="standard-input"
          value={flatType}
          onChange={(event) => setFlatType(event.target.value)}
          placeholder="Flat type (optional)"
          disabled={isSubmitting}
        />

        <textarea
          className="standard-input"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          disabled={isSubmitting}
        />

        <button type="submit" className="btn btn-primary" disabled={disabled}>
          {isSubmitting ? "Creating..." : "Create Template"}
        </button>
      </form>
    </section>
  );
}
