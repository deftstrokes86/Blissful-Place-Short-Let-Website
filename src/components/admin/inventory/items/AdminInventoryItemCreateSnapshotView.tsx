import type { AdminInventoryItem } from "@/lib/admin-inventory-api";

export interface AdminInventoryItemFormState {
  name: string;
  category: AdminInventoryItem["category"];
  unitOfMeasure: string;
  internalCode: string;
  reorderThreshold: string;
  parLevel: string;
  criticality: AdminInventoryItem["criticality"];
}

interface AdminInventoryItemCreateSnapshotViewProps {
  form: AdminInventoryItemFormState;
  isSubmitting: boolean;
  onChange: <K extends keyof AdminInventoryItemFormState>(field: K, value: AdminInventoryItemFormState[K]) => void;
  onSubmit: () => Promise<void>;
  heading?: string;
  submitLabel?: string;
}

export function AdminInventoryItemCreateSnapshotView({
  form,
  isSubmitting,
  onChange,
  onSubmit,
  heading = "Create Inventory Item",
  submitLabel = "Create Item",
}: AdminInventoryItemCreateSnapshotViewProps) {
  return (
    <section className="admin-bookings-section" aria-labelledby="inventory-item-form-heading">
      <div className="admin-bookings-section-header">
        <h2 id="inventory-item-form-heading" className="heading-sm" style={{ margin: 0 }}>
          {heading}
        </h2>
        <span className="admin-count-pill">Catalog</span>
      </div>

      <form
        className="admin-form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <label className="admin-label" htmlFor="inventory-item-name">
          Item Name
        </label>
        <input
          id="inventory-item-name"
          className="standard-input"
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          disabled={isSubmitting}
        />

        <label className="admin-label" htmlFor="inventory-item-category">
          Category
        </label>
        <select
          id="inventory-item-category"
          className="standard-input"
          value={form.category}
          onChange={(event) => onChange("category", event.target.value as AdminInventoryItemFormState["category"])}
          disabled={isSubmitting}
        >
          <option value="asset">Asset</option>
          <option value="consumable">Consumable</option>
          <option value="maintenance_supply">Maintenance Supply</option>
        </select>

        <label className="admin-label" htmlFor="inventory-item-unit">
          Unit
        </label>
        <input
          id="inventory-item-unit"
          className="standard-input"
          value={form.unitOfMeasure}
          onChange={(event) => onChange("unitOfMeasure", event.target.value)}
          disabled={isSubmitting}
        />

        <label className="admin-label" htmlFor="inventory-item-code">
          Internal Code
        </label>
        <input
          id="inventory-item-code"
          className="standard-input"
          value={form.internalCode}
          onChange={(event) => onChange("internalCode", event.target.value)}
          disabled={isSubmitting}
        />

        <label className="admin-label" htmlFor="inventory-item-threshold">
          Reorder Threshold
        </label>
        <input
          id="inventory-item-threshold"
          className="standard-input"
          type="number"
          min={0}
          step={1}
          value={form.reorderThreshold}
          onChange={(event) => onChange("reorderThreshold", event.target.value)}
          disabled={isSubmitting}
        />

        <label className="admin-label" htmlFor="inventory-item-par-level">
          Par Level
        </label>
        <input
          id="inventory-item-par-level"
          className="standard-input"
          type="number"
          min={0}
          step={1}
          value={form.parLevel}
          onChange={(event) => onChange("parLevel", event.target.value)}
          disabled={isSubmitting}
        />

        <label className="admin-label" htmlFor="inventory-item-criticality">
          Criticality
        </label>
        <select
          id="inventory-item-criticality"
          className="standard-input"
          value={form.criticality}
          onChange={(event) => onChange("criticality", event.target.value as AdminInventoryItemFormState["criticality"])}
          disabled={isSubmitting}
        >
          <option value="critical">Critical</option>
          <option value="important">Important</option>
          <option value="minor">Minor</option>
        </select>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting || form.name.trim().length === 0 || form.unitOfMeasure.trim().length === 0}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </form>
    </section>
  );
}
