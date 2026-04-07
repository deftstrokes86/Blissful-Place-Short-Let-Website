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
  overview: AdminInventoryOverview | null | undefined;
  selectedFlatId: string | null | undefined;
}

export function AdminInventorySnapshotView(input: AdminInventorySnapshotViewProps) {
  const inventoryCatalog = Array.isArray(input.overview?.inventoryCatalog) ? input.overview.inventoryCatalog : [];
  const centralStock = Array.isArray(input.overview?.centralStock) ? input.overview.centralStock : [];
  const templates = Array.isArray(input.overview?.templates) ? input.overview.templates : [];
  const flatInventory = Array.isArray(input.overview?.flatInventory) ? input.overview.flatInventory : [];
  const stockMovements = Array.isArray(input.overview?.stockMovements) ? input.overview.stockMovements : [];

  const selectedFlat =
    flatInventory.find((entry) => entry.flatId === input.selectedFlatId) ?? flatInventory[0] ?? null;
  const selectedFlatRecords = Array.isArray(selectedFlat?.records) ? selectedFlat.records : [];

  return (
    <div className="admin-inventory-snapshot">
      <section className="admin-bookings-section" aria-labelledby="inventory-catalog-heading">
        <div className="admin-bookings-section-header">
          <h3 id="inventory-catalog-heading" className="heading-sm" style={{ margin: 0 }}>
            Inventory Catalog
          </h3>
          <span className="admin-count-pill">{inventoryCatalog.length} items</span>
        </div>

        {inventoryCatalog.length === 0 ? (
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
                {inventoryCatalog.map((item, index) => {
                  const itemId = typeof item.id === "string" ? item.id.trim() : "";
                  const itemLabel = item.name?.trim() || `Item ${index + 1}`;

                  return (
                    <tr key={itemId || `catalog-item-${index}`}>
                      <td>
                        {itemId ? <Link href={`/admin/inventory/items/${itemId}`}>{itemLabel}</Link> : itemLabel}
                      </td>
                      <td>{formatInventoryCategoryLabel(item.category)}</td>
                      <td>{item.unitOfMeasure || "-"}</td>
                      <td>
                        {item.parLevel ?? "-"} / {item.reorderThreshold ?? "-"}
                      </td>
                      <td>
                        <span className={getSeverityClassName(item.criticality)}>{formatCriticalityLabel(item.criticality)}</span>
                      </td>
                    </tr>
                  );
                })}
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
                {centralStock.map((stock, index) => (
                  <tr key={stock.inventoryItemId || `central-stock-${index}`}>
                    <td>{stock.itemName || "Inventory item"}</td>
                    <td>{stock.quantity ?? 0}</td>
                    <td>{stock.unitOfMeasure || "-"}</td>
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
          <span className="admin-count-pill">{templates.length} templates</span>
        </div>

        {templates.length === 0 ? (
          <p className="text-secondary">No inventory templates configured yet.</p>
        ) : (
          <div className="admin-bookings-list">
            {templates.map((template, index) => {
              const templateItems = Array.isArray(template.items) ? template.items : [];

              return (
                <article key={template.id || `template-${index}`} className="admin-bookings-card">
                  <div className="admin-bookings-card-header">
                    <div>
                      <p className="admin-card-title">{template.name || `Template ${index + 1}`}</p>
                      <p className="text-secondary" style={{ fontSize: "0.84rem" }}>
                        {template.description ?? "No description"}
                      </p>
                    </div>
                    <span className="admin-count-pill">{templateItems.length} items</span>
                  </div>

                  {templateItems.length === 0 ? (
                    <p className="text-secondary">No template items yet.</p>
                  ) : (
                    <div className="admin-mini-table">
                      {templateItems.map((item, itemIndex) => (
                        <div key={item.id || `template-item-${index}-${itemIndex}`} className="admin-mini-table-row">
                          <p>{item.itemName ?? item.inventoryItemId ?? "Inventory item"}</p>
                          <p className="text-secondary">Expected: {item.expectedQuantity ?? 0}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="flat-inventory-heading">
        <div className="admin-bookings-section-header">
          <h3 id="flat-inventory-heading" className="heading-sm" style={{ margin: 0 }}>
            Flat Inventory
          </h3>
          <span className="admin-count-pill">{selectedFlatRecords.length} records</span>
        </div>

        {!selectedFlat ? (
          <p className="text-secondary">No flat inventory records yet.</p>
        ) : selectedFlatRecords.length === 0 ? (
          <p className="text-secondary">No flat inventory records for {selectedFlat.flatName || selectedFlat.flatId}.</p>
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
                {selectedFlatRecords.map((record, index) => (
                  <tr key={record.id || `flat-record-${index}`}>
                    <td>{record.itemName || "Inventory item"}</td>
                    <td>{record.expectedQuantity ?? 0}</td>
                    <td>{record.currentQuantity ?? 0}</td>
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
            <span className="admin-count-pill">{stockMovements.length} recent</span>
            <Link href="/admin/inventory/movements/new" className="btn btn-outline-primary">
              Record Movement
            </Link>
          </div>
        </div>

        {stockMovements.length === 0 ? (
          <p className="text-secondary">No stock movements recorded yet.</p>
        ) : (
          <div className="admin-bookings-list">
            {stockMovements.map((movement, index) => (
              <article key={movement.id || `movement-${index}`} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{movement.itemName || "Inventory item"}</p>
                  <span className="admin-status-pill">{formatMovementTypeLabel(movement.movementType)}</span>
                </div>
                <div className="admin-notifications-meta-grid">
                  <div>
                    <p className="admin-meta-label">Quantity</p>
                    <p>{movement.quantity ?? 0}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Context</p>
                    <p>{movement.contextLabel || "Context unavailable"}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Reason</p>
                    <p>{movement.reason || "Reason unavailable"}</p>
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
