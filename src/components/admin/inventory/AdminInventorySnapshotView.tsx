import Link from "next/link";

import type { AdminInventoryOverview } from "@/lib/admin-inventory-api";
import {
  formatConditionStatusLabel,
  formatCriticalityLabel,
  formatInventoryCategoryLabel,
  formatLagosDateTime,
  formatMovementTypeLabel,
  getSeverityClassName,
} from "./admin-inventory-view-model";

interface AdminInventorySnapshotViewProps {
  overview: AdminInventoryOverview;
  selectedFlatId: string;
}

export function AdminInventorySnapshotView(input: AdminInventorySnapshotViewProps) {
  const selectedFlat =
    input.overview.flatInventory.find((entry) => entry.flatId === input.selectedFlatId) ??
    input.overview.flatInventory[0] ??
    null;

  const centralStock = input.overview.centralStock ?? [];

  return (
    <div className="admin-inventory-snapshot">
      <section className="admin-bookings-section" aria-labelledby="inventory-catalog-heading">
        <div className="admin-bookings-section-header">
          <h3 id="inventory-catalog-heading" className="heading-sm" style={{ margin: 0 }}>
            Inventory Catalog
          </h3>
          <span className="admin-count-pill">{input.overview.inventoryCatalog.length} items</span>
        </div>

        {input.overview.inventoryCatalog.length === 0 ? (
          <p className="text-secondary">No inventory catalog items yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Par / Threshold</th>
                  <th>Criticality</th>
                </tr>
              </thead>
              <tbody>
                {input.overview.inventoryCatalog.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/admin/inventory/items/${item.id}`}>{item.name}</Link>
                    </td>
                    <td>{formatInventoryCategoryLabel(item.category)}</td>
                    <td>{item.unitOfMeasure}</td>
                    <td>
                      {item.parLevel ?? "-"} / {item.reorderThreshold ?? "-"}
                    </td>
                    <td>
                      <span className={getSeverityClassName(item.criticality)}>{formatCriticalityLabel(item.criticality)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="central-stock-heading">
        <div className="admin-bookings-section-header">
          <h3 id="central-stock-heading" className="heading-sm" style={{ margin: 0 }}>
            Central Stock
          </h3>
          <div className="admin-bookings-actions-row">
            <span className="admin-count-pill">{centralStock.length} tracked items</span>
            <Link href="/admin/inventory/movements/new" className="btn btn-outline-primary">
              Adjust or Transfer
            </Link>
          </div>
        </div>

        {centralStock.length === 0 ? (
          <p className="text-secondary">No central stock quantities tracked yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {centralStock.map((stock) => (
                  <tr key={stock.inventoryItemId}>
                    <td>{stock.itemName}</td>
                    <td>{stock.quantity}</td>
                    <td>{stock.unitOfMeasure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="inventory-templates-heading">
        <div className="admin-bookings-section-header">
          <h3 id="inventory-templates-heading" className="heading-sm" style={{ margin: 0 }}>
            Templates
          </h3>
          <span className="admin-count-pill">{input.overview.templates.length} templates</span>
        </div>

        {input.overview.templates.length === 0 ? (
          <p className="text-secondary">No inventory templates configured yet.</p>
        ) : (
          <div className="admin-bookings-list">
            {input.overview.templates.map((template) => (
              <article key={template.id} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <div>
                    <p className="admin-card-title">{template.name}</p>
                    <p className="text-secondary" style={{ fontSize: "0.84rem" }}>
                      {template.description ?? "No description"}
                    </p>
                  </div>
                  <span className="admin-count-pill">{template.items.length} items</span>
                </div>

                {template.items.length === 0 ? (
                  <p className="text-secondary">No template items yet.</p>
                ) : (
                  <div className="admin-mini-table">
                    {template.items.map((item) => (
                      <div key={item.id} className="admin-mini-table-row">
                        <p>{item.itemName ?? item.inventoryItemId}</p>
                        <p className="text-secondary">Expected: {item.expectedQuantity}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="flat-inventory-heading">
        <div className="admin-bookings-section-header">
          <h3 id="flat-inventory-heading" className="heading-sm" style={{ margin: 0 }}>
            Flat Inventory
          </h3>
          <span className="admin-count-pill">{selectedFlat?.records.length ?? 0} records</span>
        </div>

        {!selectedFlat ? (
          <p className="text-secondary">No flat inventory records yet.</p>
        ) : selectedFlat.records.length === 0 ? (
          <p className="text-secondary">No flat inventory records for {selectedFlat.flatName}.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Expected</th>
                  <th>Current</th>
                  <th>Condition</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {selectedFlat.records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.itemName}</td>
                    <td>{record.expectedQuantity}</td>
                    <td>{record.currentQuantity}</td>
                    <td>{formatConditionStatusLabel(record.conditionStatus)}</td>
                    <td>{record.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="stock-movements-heading">
        <div className="admin-bookings-section-header">
          <h3 id="stock-movements-heading" className="heading-sm" style={{ margin: 0 }}>
            Stock Movements
          </h3>
          <div className="admin-bookings-actions-row">
            <span className="admin-count-pill">{input.overview.stockMovements.length} recent</span>
            <Link href="/admin/inventory/movements/new" className="btn btn-outline-primary">
              Record Movement
            </Link>
          </div>
        </div>

        {input.overview.stockMovements.length === 0 ? (
          <p className="text-secondary">No stock movements recorded yet.</p>
        ) : (
          <div className="admin-bookings-list">
            {input.overview.stockMovements.map((movement) => (
              <article key={movement.id} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{movement.itemName}</p>
                  <span className="admin-status-pill">{formatMovementTypeLabel(movement.movementType)}</span>
                </div>
                <div className="admin-notifications-meta-grid">
                  <div>
                    <p className="admin-meta-label">Quantity</p>
                    <p>{movement.quantity}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Context</p>
                    <p>{movement.contextLabel}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Reason</p>
                    <p>{movement.reason}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">When</p>
                    <p>{formatLagosDateTime(movement.createdAt)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
