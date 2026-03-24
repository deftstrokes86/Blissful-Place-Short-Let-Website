# Worker Operations UI (Task Execution Surface)

## Purpose
Define a simplified, mobile-friendly worker UI for executing operational tasks derived from readiness, inventory alerts, and maintenance issues.

## Worker UX Principles
- Task-first and minimal navigation depth.
- Single-screen clarity for on-shift use.
- Mobile-friendly controls and touch targets.
- Fast completion actions with explicit escalation paths.
- No ambiguous states; every task action should produce clear next state.

## Scope
Worker UI responsibilities include:
- task list
- flat checklist execution
- issue reporting
- restock execution
- maintenance execution
- completion, unable-to-complete, shortage, and escalation workflows

Out of scope:
- catalog/template administration
- broad system configuration
- reservation-state transitions

## Worker Surface Responsibilities

### 1) Task List (`/staff/tasks`)
Visibility:
- Open tasks prioritized by severity and due urgency.
- Grouping by task type (`restock`, `maintenance`, `readiness`, `inspection`).
- Source context and flat reference.

Controls:
- Start task (`open` -> `in_progress`)
- Complete task (`open|in_progress` -> `completed`)
- Open related flat detail
- Open escalation action when blocked

Required metadata per task card:
- title
- flat
- priority
- source type/id
- last updated

### 2) Flat Checklist Execution (`/staff/flats/[flatId]`)
Visibility:
- Readiness summary for selected flat.
- Reconciliation highlights (missing/damaged/low stock).
- Flat-scoped open tasks.

Controls:
- Mark checklist line complete
- Add note/evidence text
- Create issue from checklist line
- Open restock/maintenance actions

### 3) Issue Reporting (`/staff/issues/new`)
Visibility:
- Flat selector
- Severity selector
- Title + notes fields

Controls:
- Submit maintenance issue quickly
- Optional inventory-item linkage (if available)

Expected output:
- New maintenance issue created
- Readiness recompute trigger
- Linked task generation where policy applies

### 4) Restock Execution (`/staff/restock`)
Visibility:
- Restock-only open tasks
- Required quantities and context

Controls:
- Mark restock done
- Mark shortage encountered
- Escalate shortage to admin operations

### 5) Maintenance Execution (`/staff/maintenance`)
Visibility:
- Maintenance/readiness tasks
- Open issue references and severity

Controls:
- Start/complete maintenance task
- Mark cannot complete
- Escalate with reason

## Completion and Escalation Flows

### A) Completion Flow
1. Worker opens task.
2. Worker performs action.
3. Worker marks complete.
4. UI confirms state change and removes task from open queue.
5. Provenance captured (`actor`, `timestamp`, `source context`).

### B) Cannot-Complete Flow
1. Worker opens task.
2. Worker selects `Cannot Complete`.
3. Worker provides required reason.
4. Task moves to escalation-pending path (or remains `in_progress` with escalation flag based on service policy).
5. Admin sees escalated state with reason and source.

### C) Shortage Flow
1. Worker attempts restock.
2. Central/flat stock insufficient.
3. Worker submits shortage note.
4. System creates or updates shortage/escalation task for admin review.
5. Alert/task provenance links to original restock task.

### D) Escalation Flow
1. Worker selects escalation action from task or flat checklist.
2. Worker chooses escalation reason category (`shortage`, `blocked_access`, `technical_failure`, `other`).
3. Worker submits notes.
4. Escalation artifact appears in admin task/maintenance oversight.

## Mobile Interaction Requirements
- Primary actions always visible without horizontal scrolling.
- Sticky action bar for task status updates on small screens.
- Large, clear status controls (`Start`, `Complete`, `Escalate`).
- Minimal form fields per step.

## Provenance Requirements for Worker Actions
For every completion/cannot-complete/escalation action, store and render:
- `source_type`
- `source_id`
- actor id
- action timestamp
- optional reason/notes

## Integration and Safety Rules
- Worker actions operate through services; no direct reservation-state writes.
- Readiness impact is computed/service-driven.
- Unavailability impact is handled via readiness + block workflows, not hidden task side effects.

## Missing-Flow Coverage (Worker)
Explicitly implementation-required:
- task completion flow
- cannot-complete flow
- shortage flow
- escalation flow
- issue reporting flow
- flat checklist execution flow
