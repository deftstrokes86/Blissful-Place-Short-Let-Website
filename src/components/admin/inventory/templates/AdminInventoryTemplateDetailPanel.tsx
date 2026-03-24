"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchInventoryTemplate,
  submitAddInventoryTemplateItem,
  submitApplyInventoryTemplateToFlat,
  submitRemoveInventoryTemplateItem,
  submitUpdateInventoryTemplate,
  submitUpdateInventoryTemplateItemQuantity,
} from "@/lib/admin-inventory-templates-api";
import { fetchAdminInventoryOverview } from "@/lib/admin-inventory-api";
import type { FlatId } from "@/types/booking";
import {
  isAddTemplateItemDisabled,
  isApplyTemplateDisabled,
  isRemoveTemplateItemDisabled,
  isUpdateTemplateItemQuantityDisabled,
} from "./admin-template-editor-view-model";

interface AdminInventoryTemplateDetailPanelProps {
  templateId: string;
}

type LoadState = {
  template: {
    id: string;
    name: string;
    description: string | null;
    flatType: string | null;
  };
  items: Array<{
    id: string;
    inventoryItemId: string;
    expectedQuantity: number;
  }>;
  inventoryItems: Array<{
    id: string;
    name: string;
  }>;
  flats: Array<{
    id: FlatId;
    name: string;
  }>;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to complete template operation right now.";
}

function toPositiveInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : 0;
}

export function AdminInventoryTemplateDetailPanel({ templateId }: AdminInventoryTemplateDetailPanelProps) {
  const [state, setState] = useState<LoadState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const [metadataForm, setMetadataForm] = useState({
    name: "",
    description: "",
    flatType: "",
  });

  const [addItemForm, setAddItemForm] = useState({
    inventoryItemId: "",
    expectedQuantity: "1",
  });

  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const [applyFlatId, setApplyFlatId] = useState<FlatId | "">("");
  const [applyResultSummary, setApplyResultSummary] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [detail, overview] = await Promise.all([fetchInventoryTemplate(templateId), fetchAdminInventoryOverview()]);

      const nextState: LoadState = {
        template: detail.template,
        items: detail.items,
        inventoryItems: overview.inventoryCatalog.map((item) => ({
          id: item.id,
          name: item.name,
        })),
        flats: overview.flats,
      };

      setState(nextState);
      setMetadataForm({
        name: detail.template.name,
        description: detail.template.description ?? "",
        flatType: detail.template.flatType ?? "",
      });
      setQuantityDrafts(Object.fromEntries(detail.items.map((item) => [item.id, String(item.expectedQuantity)])));
      setAddItemForm((current) => ({
        inventoryItemId: current.inventoryItemId,
        expectedQuantity: current.expectedQuantity,
      }));
      setApplyFlatId((current) => current || overview.flats[0]?.id || "");
      setNotice(null);
    } catch (error) {
      setNotice({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const usedItemIds = useMemo(() => new Set(state?.items.map((item) => item.inventoryItemId) ?? []), [state]);

  const availableItems = useMemo(
    () => (state?.inventoryItems ?? []).filter((item) => !usedItemIds.has(item.id)),
    [state, usedItemIds]
  );

  const inventoryItemNameById = useMemo(
    () => new Map((state?.inventoryItems ?? []).map((item) => [item.id, item.name])),
    [state]
  );

  const addExpectedQuantity = toPositiveInteger(addItemForm.expectedQuantity);
  const addItemDisabled =
    !state ||
    isAddTemplateItemDisabled({
      isSubmitting,
      templateId: state.template.id,
      inventoryItemId: addItemForm.inventoryItemId,
      expectedQuantity: addExpectedQuantity,
    });

  const applyDisabled =
    !state ||
    isApplyTemplateDisabled({
      isSubmitting,
      templateId: state.template.id,
      flatId: applyFlatId,
    });

  async function handleSaveMetadata(): Promise<void> {
    if (!state || isSubmitting || metadataForm.name.trim().length === 0) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const updated = await submitUpdateInventoryTemplate({
        templateId: state.template.id,
        name: metadataForm.name,
        description: metadataForm.description.trim() || null,
        flatType: metadataForm.flatType.trim() || null,
      });

      setState((current) =>
        current
          ? {
              ...current,
              template: {
                ...current.template,
                name: updated.name,
                description: updated.description,
                flatType: updated.flatType,
              },
            }
          : current
      );

      setNotice({ tone: "ok", message: "Template metadata updated." });
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddItem(): Promise<void> {
    if (!state || addItemDisabled) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitAddInventoryTemplateItem({
        templateId: state.template.id,
        inventoryItemId: addItemForm.inventoryItemId,
        expectedQuantity: addExpectedQuantity,
      });

      await loadData();
      setAddItemForm({
        inventoryItemId: "",
        expectedQuantity: "1",
      });
      setNotice({ tone: "ok", message: "Template item added." });
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateQuantity(templateItemId: string): Promise<void> {
    if (!state) {
      return;
    }

    const expectedQuantity = toPositiveInteger(quantityDrafts[templateItemId] ?? "0");
    const disabled = isUpdateTemplateItemQuantityDisabled({
      isSubmitting,
      templateItemId,
      expectedQuantity,
    });

    if (disabled) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitUpdateInventoryTemplateItemQuantity({
        templateId: state.template.id,
        templateItemId,
        expectedQuantity,
      });

      await loadData();
      setNotice({ tone: "ok", message: "Expected quantity updated." });
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveItem(templateItemId: string): Promise<void> {
    if (!state) {
      return;
    }

    const disabled = isRemoveTemplateItemDisabled({
      isSubmitting,
      templateItemId,
    });

    if (disabled) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitRemoveInventoryTemplateItem({
        templateId: state.template.id,
        templateItemId,
      });

      await loadData();
      setNotice({ tone: "ok", message: "Template item removed." });
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApplyTemplate(): Promise<void> {
    if (!state || applyDisabled) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const flatId = applyFlatId as FlatId;
      const result = await submitApplyInventoryTemplateToFlat({
        templateId: state.template.id,
        flatId,
      });

      setApplyResultSummary(
        `Applied to ${result.flatId}: ${result.createdCount} created, ${result.updatedCount} updated (${result.totalTemplateItems} template items).`
      );
      setNotice({ tone: "ok", message: "Template applied to flat." });
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-inventory-panel">
      {notice ? (
        <div className={`booking-inline-note ${notice.tone === "ok" ? "booking-inline-note-ok" : "booking-inline-note-muted"}`}>
          {notice.message}
        </div>
      ) : null}

      {isLoading || !state ? (
        <div className="booking-inline-note booking-inline-note-soft">Loading template detail...</div>
      ) : (
        <>
          <section className="admin-bookings-section" aria-labelledby="template-metadata-heading">
            <div className="admin-bookings-section-header">
              <h2 id="template-metadata-heading" className="heading-sm" style={{ margin: 0 }}>
                Template Metadata
              </h2>
              <span className="admin-count-pill">{state.template.id}</span>
            </div>

            <form
              className="admin-form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSaveMetadata();
              }}
            >
              <input
                className="standard-input"
                value={metadataForm.name}
                onChange={(event) => setMetadataForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Template name"
                disabled={isSubmitting}
              />

              <input
                className="standard-input"
                value={metadataForm.flatType}
                onChange={(event) => setMetadataForm((current) => ({ ...current, flatType: event.target.value }))}
                placeholder="Flat type"
                disabled={isSubmitting}
              />

              <textarea
                className="standard-input"
                rows={3}
                value={metadataForm.description}
                onChange={(event) => setMetadataForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description"
                disabled={isSubmitting}
              />

              <button type="submit" className="btn btn-outline-primary" disabled={isSubmitting || metadataForm.name.trim().length === 0}>
                {isSubmitting ? "Saving..." : "Save Metadata"}
              </button>
            </form>
          </section>

          <section className="admin-bookings-section" aria-labelledby="template-items-heading">
            <div className="admin-bookings-section-header">
              <h2 id="template-items-heading" className="heading-sm" style={{ margin: 0 }}>
                Template Items and Expected Quantities
              </h2>
              <span className="admin-count-pill">{state.items.length} items</span>
            </div>

            <div className="admin-grid-two">
              <form
                className="admin-form-grid"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAddItem();
                }}
              >
                <p className="admin-meta-label">Add Template Item</p>

                <select
                  className="standard-input"
                  value={addItemForm.inventoryItemId}
                  onChange={(event) => setAddItemForm((current) => ({ ...current, inventoryItemId: event.target.value }))}
                  disabled={isSubmitting}
                >
                  <option value="">Select inventory item</option>
                  {availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <input
                  className="standard-input"
                  type="number"
                  min={1}
                  step={1}
                  value={addItemForm.expectedQuantity}
                  onChange={(event) => setAddItemForm((current) => ({ ...current, expectedQuantity: event.target.value }))}
                  disabled={isSubmitting}
                />

                <button type="submit" className="btn btn-primary" disabled={addItemDisabled}>
                  {isSubmitting ? "Adding..." : "Add Item"}
                </button>
              </form>

              <div className="admin-table-wrap">
                {state.items.length === 0 ? (
                  <p className="text-secondary">No template items yet.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Inventory Item</th>
                        <th>Expected Quantity</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <p className="admin-card-title">{inventoryItemNameById.get(item.inventoryItemId) ?? item.inventoryItemId}</p>
                            <p className="text-secondary" style={{ fontSize: "0.78rem" }}>
                              {item.inventoryItemId}
                            </p>
                          </td>
                          <td>
                            <input
                              className="standard-input"
                              type="number"
                              min={1}
                              step={1}
                              value={quantityDrafts[item.id] ?? String(item.expectedQuantity)}
                              onChange={(event) =>
                                setQuantityDrafts((current) => ({
                                  ...current,
                                  [item.id]: event.target.value,
                                }))
                              }
                              disabled={isSubmitting}
                              style={{ minWidth: "88px", maxWidth: "120px" }}
                            />
                          </td>
                          <td>
                            <div className="admin-bookings-actions-row">
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                disabled={isUpdateTemplateItemQuantityDisabled({
                                  isSubmitting,
                                  templateItemId: item.id,
                                  expectedQuantity: toPositiveInteger(quantityDrafts[item.id] ?? String(item.expectedQuantity)),
                                })}
                                onClick={() => void handleUpdateQuantity(item.id)}
                              >
                                Save Quantity
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-primary admin-btn-danger"
                                disabled={isRemoveTemplateItemDisabled({ isSubmitting, templateItemId: item.id })}
                                onClick={() => void handleRemoveItem(item.id)}
                              >
                                Remove Item
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>

          <section className="admin-bookings-section" aria-labelledby="template-apply-heading" id="apply-template">
            <div className="admin-bookings-section-header">
              <h2 id="template-apply-heading" className="heading-sm" style={{ margin: 0 }}>
                Apply Template to Flat
              </h2>
              <span className="admin-count-pill">Guided Action</span>
            </div>

            <div className="admin-form-grid">
              <p className="text-secondary" style={{ fontSize: "0.9rem" }}>
                1. Select a flat. 2. Confirm this template should set expected quantities. 3. Apply and review created/updated counts.
              </p>

              <select
                className="standard-input"
                value={applyFlatId}
                onChange={(event) => setApplyFlatId(event.target.value as FlatId)}
                disabled={isSubmitting}
              >
                <option value="">Select flat</option>
                {state.flats.map((flat) => (
                  <option key={flat.id} value={flat.id}>
                    {flat.name}
                  </option>
                ))}
              </select>

              <button type="button" className="btn btn-primary" disabled={applyDisabled} onClick={() => void handleApplyTemplate()}>
                {isSubmitting ? "Applying..." : "Apply Template"}
              </button>

              {applyResultSummary ? <div className="booking-inline-note booking-inline-note-soft">{applyResultSummary}</div> : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
