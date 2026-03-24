# Inventory and Worker Route Map

## Purpose
Define route-by-route purpose, visibility, and control responsibilities for the full inventory/readiness and worker-task system.

## Access Model
- Admin routes: admin/staff authenticated operations surface.
- Worker routes: staff-focused execution surface (still authenticated and role-guarded).

## Global Safety Constraints
- Inventory/readiness/task routes must not directly mutate reservation states.
- Blocking availability decisions must pass through availability/manual-block services.
- Provenance must be visible wherever a status can affect readiness or operational blocking.

## Admin Routes

### `/admin/inventory`
Purpose:
- Primary inventory operations dashboard.

Visibility:
- catalog snapshot, templates snapshot, flat inventory summary, stock movement summary.

Controls:
- filtering by flat
- refresh operational data
- jump to specialized inventory routes

### `/admin/inventory/items/new`
Purpose:
- Create new catalog item.

Visibility:
- item create form with category/unit/criticality/threshold fields.

Controls:
- submit new item
- validation feedback

### `/admin/inventory/items/[itemId]`
Purpose:
- View and edit item details.

Visibility:
- item metadata, usage footprint (templates/flats), movement references.

Controls:
- edit item fields
- active/inactive toggle

### `/admin/inventory/templates`
Purpose:
- List and manage templates.

Visibility:
- template cards/table with item counts and flat-type metadata.

Controls:
- open template
- start create template flow
- trigger apply flow entry

### `/admin/inventory/templates/new`
Purpose:
- Create template and initial template items.

Visibility:
- template metadata form + add-item rows.

Controls:
- create template
- add/remove template items

### `/admin/inventory/templates/[templateId]`
Purpose:
- Edit template and run apply workflow.

Visibility:
- template detail, item rows, expected quantities, prior apply history.

Controls:
- edit metadata
- update expected quantities
- apply template to selected flat(s)

### `/admin/inventory/stock`
Purpose:
- Central stock posture and threshold oversight.

Visibility:
- central stock quantities, par/reorder deltas, criticality highlights.

Controls:
- open adjustment flow
- open transfer flow

### `/admin/inventory/movements`
Purpose:
- Movement audit log.

Visibility:
- chronological movement records with context and provenance.

Controls:
- filter by item/flat/type/date
- drill into movement details

### `/admin/inventory/movements/new`
Purpose:
- Record stock movement actions.

Visibility:
- movement entry form (`add`, `deduct`, `consume`, `adjust`, `damage`, `replace`, `transfer`).

Controls:
- submit movement with reason/notes
- transfer source/destination entry

### `/admin/inventory/flats/[flatId]`
Purpose:
- Flat-level reconciliation workspace.

Visibility:
- expected vs current inventory rows
- condition statuses and discrepancy highlights
- flat-scoped readiness context

Controls:
- update observed quantity/condition/notes
- create follow-up issue/task from discrepancy

### `/admin/inventory/alerts`
Purpose:
- Alert triage and tracking.

Visibility:
- active alerts by severity/type/flat with linked source references.

Controls:
- acknowledge/resolve (per policy)
- open linked issue/task context

### `/admin/inventory/maintenance`
Purpose:
- Maintenance issue oversight.

Visibility:
- issue queue with severity/status/flat linkage.

Controls:
- create issue
- update issue status
- inspect readiness impact

### `/admin/readiness`
Purpose:
- Readiness dashboard and override operations.

Visibility:
- component statuses, overall readiness, active overrides, linked issues/alerts.

Controls:
- recompute readiness
- set/clear manual override (reason required)

### `/admin/tasks`
Purpose:
- Operational task oversight across flats.

Visibility:
- system-generated + manual tasks with provenance.

Controls:
- create manual task
- assign/reassign
- update status
- filter by flat/status/priority/type

## Worker Routes

### `/staff/tasks`
Purpose:
- Worker task queue home.

Visibility:
- open tasks grouped/prioritized for execution.

Controls:
- start/complete task
- open escalation action
- open linked flat detail

### `/staff/flats/[flatId]`
Purpose:
- Flat execution detail.

Visibility:
- readiness summary
- inventory checklist highlights
- flat-scoped open tasks

Controls:
- execute checklist actions
- launch issue reporting/escalation

### `/staff/issues/new`
Purpose:
- Quick maintenance/operational issue reporting.

Visibility:
- compact issue form.

Controls:
- submit issue with severity and notes
- optional item linkage

### `/staff/restock`
Purpose:
- Restock execution queue.

Visibility:
- restock tasks and shortage context.

Controls:
- mark complete
- report shortage
- escalate unable-to-restock states

### `/staff/maintenance`
Purpose:
- Maintenance execution queue.

Visibility:
- maintenance/readiness tasks with priority and context.

Controls:
- start/complete
- cannot-complete with reason
- escalate blocked cases

## Missing Flow Coverage (Route Responsibilities)

### Item create/edit
- Create via `/admin/inventory/items/new`
- Edit via `/admin/inventory/items/[itemId]`

### Template create/edit/apply
- Create via `/admin/inventory/templates/new`
- Edit/apply via `/admin/inventory/templates/[templateId]`

### Central stock adjustments
- Overview via `/admin/inventory/stock`
- Action entry via `/admin/inventory/movements/new`

### Stock transfer
- Executed in `/admin/inventory/movements/new` as transfer movement type

### Flat inventory reconciliation
- Executed in `/admin/inventory/flats/[flatId]`

### Readiness override
- Executed in `/admin/readiness`

### Task completion / cannot-complete / shortage / escalation
- Worker execution in `/staff/tasks`, `/staff/restock`, `/staff/maintenance`
- Admin oversight in `/admin/tasks` and `/admin/inventory/maintenance`

## Implementation Readiness Notes
For every route implementation, include:
- clear read model (what the user sees)
- clear write model (what user can change)
- validation and error handling
- provenance display for status-affecting records
- explicit service boundary adherence (no hidden reservation mutation)
