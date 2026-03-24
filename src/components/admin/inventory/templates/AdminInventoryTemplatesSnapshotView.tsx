import Link from "next/link";

import type { AdminInventoryTemplateSummary } from "@/lib/admin-inventory-templates-api";

interface AdminInventoryTemplatesSnapshotViewProps {
  templates: AdminInventoryTemplateSummary[];
}

export function AdminInventoryTemplatesSnapshotView({ templates }: AdminInventoryTemplatesSnapshotViewProps) {
  return (
    <section className="admin-bookings-section" aria-labelledby="inventory-templates-list-heading">
      <div className="admin-bookings-section-header">
        <h2 id="inventory-templates-list-heading" className="heading-sm" style={{ margin: 0 }}>
          Template Library
        </h2>
        <span className="admin-count-pill">{templates.length} templates</span>
      </div>

      {templates.length === 0 ? (
        <div className="admin-template-empty-state">
          <p className="text-secondary">No templates configured yet.</p>
          <p className="text-secondary">Create your first template to standardize expected flat setup.</p>
          <Link href="/admin/inventory/templates/new" className="btn btn-primary">
            Create First Template
          </Link>
        </div>
      ) : (
        <div className="admin-bookings-list">
          {templates.map((template) => (
            <article key={template.id} className="admin-bookings-card">
              <div className="admin-bookings-card-header">
                <div>
                  <p className="admin-card-title">{template.name}</p>
                  <p className="text-secondary" style={{ fontSize: "0.84rem" }}>
                    Flat Type: {template.flatType ?? "Any"}
                  </p>
                </div>
                <span className="admin-count-pill">{template.itemCount} items</span>
              </div>

              <p className="admin-notification-summary">{template.description ?? "No description provided."}</p>

              <div className="admin-bookings-actions-row">
                <Link href={`/admin/inventory/templates/${template.id}`} className="btn btn-outline-primary">
                  Open Template
                </Link>
                <Link href={`/admin/inventory/templates/${template.id}`} className="btn btn-primary">
                  Apply to Flat
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
