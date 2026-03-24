# Inventory UI (Admin and Operational Control)

## Purpose
Define the UI responsibilities, information architecture, and control workflows for the inventory and readiness control surface before route implementation.

This UI is for operational readiness control, not ERP behavior.

## Scope and Boundaries
- Inventory must never directly mutate reservation states.
- Readiness and inventory outcomes influence operations through alerts, tasks, and manual/critical blocking recommendations.
- Availability truth remains calendar-block-driven.
- Procurement/vendor management is out of scope.
- Worker screens are intentionally simpler than admin screens.

## UX Principles
- Admin UI should be information-rich without clutter.
- Worker-facing handoff artifacts (tasks, reasons, source links) must be explicit and scannable.
- Every blocking or status-driving element must show provenance.
Provenance minimums:
- source type (`manual`, `alert`, `maintenance_issue`, `readiness`)
- source id/reference
- actor or system origin
- timestamp(s)

## Admin Information Architecture
Primary operational clusters:
1. Catalog and item management
2. Templates and flat setup baselines
3. Stock state and movement operations
4. Flat-level reconciliation
5. Readiness, alerts, maintenance, and tasks

## Admin Responsibility Map

### 1) Inventory Catalog
Responsibilities:
- List catalog items with category, unit, criticality, par/reorder values, and active state.
- Support filtering/search by category, criticality, active state.
- Surface where each item is used (template count, flat assignment count).

Visibility:
- Item metadata table
- Usage summary chips
- Last update metadata

Controls:
- Create item
- Edit item
- Activate/deactivate item

Validation:
- Name required
- Valid category required
- Unit required
- Numeric thresholds/par levels must be non-negative integers when present

Provenance:
- `created_at`, `updated_at`
- last actor (when available)

### 2) Item CRUD
Create flow:
1. Open create form.
2. Enter metadata.
3. Validate + submit.
4. Show success + route to item detail.

Edit flow:
1. Open item detail.
2. Modify mutable fields.
3. Save with optimistic guard + server confirmation.
4. Show change audit summary.

Guardrails:
- Deactivation should warn if item is used in active templates/flats.
- No destructive hard delete in MVP.

### 3) Templates CRUD and Apply Flows
Responsibilities:
- Manage template list and template details.
- Create/edit template metadata.
- Add/remove template items with expected quantities.
- Apply template to target flat(s).

Visibility:
- Template summary (flat type, item count, last update)
- Item rows with expected quantity + item criticality
- Apply history panel (target flat, actor, timestamp)

Controls:
- Create template
- Edit template metadata
- Add/remove template items
- Apply template to flat

Validation:
- Template name required
- Expected quantity must be positive integer
- Prevent duplicate inventory item rows within template

Apply guardrails:
- Applying template updates expected quantities; does not erase non-template flat overrides.
- Show apply impact preview: records created vs updated.

### 4) Central Stock Overview
Responsibilities:
- Show central stock by item with par/reorder context.
- Highlight below-threshold and critical items.

Visibility:
- Quantity, threshold, par, trend cues
- Low-stock and critical chips

Controls:
- Open adjustment action
- Open transfer action

Validation:
- Adjustments must result in non-negative quantity

Provenance:
- Last movement reference + timestamp

### 5) Stock Movements
Responsibilities:
- Show movement history (`add`, `deduct`, `consume`, `adjust`, `damage`, `replace`, `transfer`).
- Provide movement detail and filtering.

Visibility:
- Movement type, quantity, context, reason, actor, timestamp
- Flat/central origin context label

Controls:
- Create new movement
- Filter by flat, item, type, date range

Guardrails:
- Positive quantity required
- Reason required
- No negative stock outcome

### 6) Stock Transfer Flow
Required flow:
1. Select item.
2. Select source (`central` or flat) and destination.
3. Enter quantity and reason.
4. Validate source sufficiency.
5. Submit transfer and record movement with provenance.

Expected output:
- Source and destination quantities updated atomically.
- Single transfer movement record with context.

### 7) Flat Inventory Reconciliation
Responsibilities:
- Compare expected vs current by item for a flat.
- Mark condition (`ok`, `missing`, `damaged`, `needs_replacement`).
- Record notes/check timestamps.

Visibility:
- Delta columns (expected/current)
- Condition badges
- Reconciliation exceptions grouped first

Controls:
- Update observed quantity/condition
- Save reconciliation notes
- Trigger follow-up task creation from discrepancy

Guardrails:
- Current quantity non-negative integer
- Condition required for damaged/missing states

### 8) Readiness Dashboard
Responsibilities:
- Show component statuses and computed overall readiness.
- Show reasons for non-ready states.
- Support override visibility and actions.

Visibility:
- Component grid (`cleaning`, `linen`, `consumables`, `maintenance`, `critical assets`)
- Overall status (`ready`, `needs_attention`, `out_of_service`)
- Underlying issues/alerts linked

Controls:
- Recompute readiness
- Set/clear override with mandatory reason

### 9) Readiness Override Flow
Required flow:
1. Open flat readiness detail.
2. Choose override status.
3. Enter required reason.
4. Confirm action.
5. Display active override banner while keeping underlying component issues visible.

Guardrails:
- Override never hides root-state visibility.
- Clearing override restores computed readiness, not manual defaults.

### 10) Alerts Oversight
Responsibilities:
- Triage active alerts by severity and flat.
- Acknowledge/resolve where policy allows.
- Link alerts to related task/issue context.

Visibility:
- Alert type, severity, flat, message, created timestamp
- Linked item and readiness impact

Controls:
- Filter by severity/type/flat
- Open linked task or issue

### 11) Maintenance Issue Oversight
Responsibilities:
- Create, update, and resolve maintenance issues.
- Track issue states and readiness impact.

Visibility:
- Status, severity, flat, linked item, notes, timestamps

Controls:
- Create issue
- Update status (`open`, `in_progress`, `resolved`, `closed`)

Guardrails:
- Status transitions should trigger readiness recomputation.

### 12) Operational Task Oversight
Responsibilities:
- View system-generated and manual tasks.
- Create manual tasks.
- Reassign and update task statuses.
- Distinguish task provenance (`alert`, `maintenance_issue`, `readiness`, `manual`).

Visibility:
- Task type, priority, status, flat, source type/id, assignee, timestamps

Controls:
- Create manual task
- Update task status (`open`, `in_progress`, `completed`, `cancelled`)
- Filter by flat/status/type/priority

## Missing-Flow Coverage (Admin)
Implementation-required flows:
- Item create/edit flows
- Template create/edit/apply flows
- Central stock adjustments
- Stock transfer flow
- Flat inventory reconciliation
- Readiness override flow
- Task management oversight flow

## Delivery Readiness Checklist
- Each admin surface has both visibility and control actions.
- Every operationally significant status has provenance metadata.
- No route implies reservation-state mutation.
- Worker handoff outputs (tasks/issues) are generated with source references.
