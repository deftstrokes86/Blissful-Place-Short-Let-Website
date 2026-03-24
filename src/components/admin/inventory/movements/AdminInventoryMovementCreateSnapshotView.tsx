import type { FlatId } from "@/types/booking";
import type { AdminStockMovement } from "@/lib/admin-inventory-api";

export interface AdminInventoryMovementFormState {
  movementType: Exclude<AdminStockMovement["movementType"], "transfer">;
  inventoryItemId: string;
  quantity: string;
  adjustToQuantity: string;
  flatId: FlatId | "";
  reason: string;
  notes: string;
}

export interface AdminInventoryTransferFormState {
  inventoryItemId: string;
  quantity: string;
  fromFlatId: FlatId | "";
  toFlatId: FlatId | "";
  reason: string;
  notes: string;
}

interface AdminInventoryMovementCreateSnapshotViewProps {
  itemOptions: Array<{
    id: string;
    name: string;
  }>;
  movementForm: AdminInventoryMovementFormState;
  transferForm: AdminInventoryTransferFormState;
  isSubmitting: boolean;
  onMovementChange: <K extends keyof AdminInventoryMovementFormState>(field: K, value: AdminInventoryMovementFormState[K]) => void;
  onTransferChange: <K extends keyof AdminInventoryTransferFormState>(field: K, value: AdminInventoryTransferFormState[K]) => void;
  onCreateMovement: () => Promise<void>;
  onCreateTransfer: () => Promise<void>;
}

export function AdminInventoryMovementCreateSnapshotView({
  itemOptions,
  movementForm,
  transferForm,
  isSubmitting,
  onMovementChange,
  onTransferChange,
  onCreateMovement,
  onCreateTransfer,
}: AdminInventoryMovementCreateSnapshotViewProps) {
  return (
    <div className="admin-inventory-snapshot">
      <section className="admin-bookings-section" aria-labelledby="movement-create-heading">
        <div className="admin-bookings-section-header">
          <h2 id="movement-create-heading" className="heading-sm" style={{ margin: 0 }}>
            Record Stock Movement
          </h2>
          <span className="admin-count-pill">Audit</span>
        </div>

        <form
          className="admin-form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void onCreateMovement();
          }}
        >
          <label className="admin-label" htmlFor="movement-type">
            Movement Type
          </label>
          <select
            id="movement-type"
            className="standard-input"
            value={movementForm.movementType}
            onChange={(event) => onMovementChange("movementType", event.target.value as AdminInventoryMovementFormState["movementType"])}
            disabled={isSubmitting}
          >
            <option value="add">Add</option>
            <option value="deduct">Deduct</option>
            <option value="consume">Consume</option>
            <option value="adjust">Adjust</option>
            <option value="damage">Damage</option>
            <option value="replace">Replace</option>
          </select>

          <label className="admin-label" htmlFor="movement-item">
            Item
          </label>
          <select
            id="movement-item"
            className="standard-input"
            value={movementForm.inventoryItemId}
            onChange={(event) => onMovementChange("inventoryItemId", event.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select item</option>
            {itemOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <label className="admin-label" htmlFor="movement-quantity">
            Quantity
          </label>
          <input
            id="movement-quantity"
            className="standard-input"
            type="number"
            min={1}
            step={1}
            value={movementForm.quantity}
            onChange={(event) => onMovementChange("quantity", event.target.value)}
            disabled={isSubmitting || movementForm.movementType === "adjust"}
          />

          <label className="admin-label" htmlFor="movement-adjust-to">
            Adjust To Quantity
          </label>
          <input
            id="movement-adjust-to"
            className="standard-input"
            type="number"
            min={0}
            step={1}
            value={movementForm.adjustToQuantity}
            onChange={(event) => onMovementChange("adjustToQuantity", event.target.value)}
            disabled={isSubmitting || movementForm.movementType !== "adjust"}
          />

          <label className="admin-label" htmlFor="movement-flat">
            Flat (Optional)
          </label>
          <select
            id="movement-flat"
            className="standard-input"
            value={movementForm.flatId}
            onChange={(event) => onMovementChange("flatId", event.target.value as AdminInventoryMovementFormState["flatId"])}
            disabled={isSubmitting}
          >
            <option value="">Central Stock</option>
            <option value="windsor">Windsor</option>
            <option value="kensington">Kensington</option>
            <option value="mayfair">Mayfair</option>
          </select>

          <label className="admin-label" htmlFor="movement-reason">
            Reason
          </label>
          <input
            id="movement-reason"
            className="standard-input"
            value={movementForm.reason}
            onChange={(event) => onMovementChange("reason", event.target.value)}
            disabled={isSubmitting}
          />

          <label className="admin-label" htmlFor="movement-notes">
            Notes
          </label>
          <textarea
            id="movement-notes"
            className="standard-input"
            rows={3}
            value={movementForm.notes}
            onChange={(event) => onMovementChange("notes", event.target.value)}
            disabled={isSubmitting}
          />

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Create Movement"}
          </button>
        </form>
      </section>

      <section className="admin-bookings-section" aria-labelledby="transfer-create-heading">
        <div className="admin-bookings-section-header">
          <h2 id="transfer-create-heading" className="heading-sm" style={{ margin: 0 }}>
            Transfer Stock
          </h2>
          <span className="admin-count-pill">From / To</span>
        </div>

        <form
          className="admin-form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void onCreateTransfer();
          }}
        >
          <label className="admin-label" htmlFor="transfer-item">
            Item
          </label>
          <select
            id="transfer-item"
            className="standard-input"
            value={transferForm.inventoryItemId}
            onChange={(event) => onTransferChange("inventoryItemId", event.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select item</option>
            {itemOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <label className="admin-label" htmlFor="transfer-quantity">
            Quantity
          </label>
          <input
            id="transfer-quantity"
            className="standard-input"
            type="number"
            min={1}
            step={1}
            value={transferForm.quantity}
            onChange={(event) => onTransferChange("quantity", event.target.value)}
            disabled={isSubmitting}
          />

          <label className="admin-label" htmlFor="transfer-from">
            From
          </label>
          <select
            id="transfer-from"
            className="standard-input"
            value={transferForm.fromFlatId}
            onChange={(event) => onTransferChange("fromFlatId", event.target.value as AdminInventoryTransferFormState["fromFlatId"])}
            disabled={isSubmitting}
          >
            <option value="">Central Stock</option>
            <option value="windsor">Windsor</option>
            <option value="kensington">Kensington</option>
            <option value="mayfair">Mayfair</option>
          </select>

          <label className="admin-label" htmlFor="transfer-to">
            To
          </label>
          <select
            id="transfer-to"
            className="standard-input"
            value={transferForm.toFlatId}
            onChange={(event) => onTransferChange("toFlatId", event.target.value as AdminInventoryTransferFormState["toFlatId"])}
            disabled={isSubmitting}
          >
            <option value="">Central Stock</option>
            <option value="windsor">Windsor</option>
            <option value="kensington">Kensington</option>
            <option value="mayfair">Mayfair</option>
          </select>

          <label className="admin-label" htmlFor="transfer-reason">
            Reason
          </label>
          <input
            id="transfer-reason"
            className="standard-input"
            value={transferForm.reason}
            onChange={(event) => onTransferChange("reason", event.target.value)}
            disabled={isSubmitting}
          />

          <label className="admin-label" htmlFor="transfer-notes">
            Notes
          </label>
          <textarea
            id="transfer-notes"
            className="standard-input"
            rows={3}
            value={transferForm.notes}
            onChange={(event) => onTransferChange("notes", event.target.value)}
            disabled={isSubmitting}
          />

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Create Transfer"}
          </button>
        </form>
      </section>
    </div>
  );
}
