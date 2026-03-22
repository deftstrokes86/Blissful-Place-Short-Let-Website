# Flat Readiness Model

## Purpose
Readiness determines whether a flat is operationally fit for guest stay.
It must be derived from component state, not only manually toggled.

## Readiness Inputs
At minimum, readiness is derived from:
- cleaning status
- linen status
- consumables status
- maintenance status
- critical asset status
- optional manual override with reason

## Component Status Model
Use consistent component values:
- `ready`
- `attention_required`
- `blocked`

Interpretation:
- `ready`: component is operationally acceptable.
- `attention_required`: issue exists but not an immediate hard-stop.
- `blocked`: critical issue that prevents safe/quality-ready occupancy.

## Overall Readiness Status
Use explicit overall statuses:
- `ready`
- `needs_attention`
- `out_of_service`

Derivation rules:
1. `out_of_service` when:
- any critical component is `blocked`, or
- a manual override sets `out_of_service`.
2. `needs_attention` when:
- no blocking condition exists, and
- one or more components are `attention_required`.
3. `ready` when:
- all required components are `ready`, and
- no active out-of-service override exists.

## Manual Override
Manual override is optional and must be explicit.

Suggested override fields:
- `override_status` (`ready`, `needs_attention`, `out_of_service`)
- `override_reason`
- `override_notes`
- `override_set_by`
- `override_set_at`
- `override_expires_at` (optional)

Rules:
- Override must never silently hide underlying component issues.
- Underlying component states remain visible for audit and recovery.

## Severity Model
Issue severity levels:
- `critical`
- `important`
- `minor`

Recommended effect mapping:
- `critical`: can force component `blocked`, often drives `out_of_service`.
- `important`: usually maps to `attention_required`.
- `minor`: typically informational unless cumulative thresholds are breached.

## Maintenance Issue Tracking
Readiness must support lightweight maintenance issue records.

Suggested issue fields:
- `id`
- `flat_id`
- `linked_inventory_item_id` (nullable)
- `title`
- `severity`
- `status` (`open`, `in_progress`, `resolved`, `closed`)
- `notes`
- `reported_at`
- `resolved_at` (nullable)
- `created_at`
- `updated_at`

Rules:
- Open critical issues should affect readiness immediately.
- Resolving issues should trigger readiness recomputation.

## Condition and Missing/Damage Influence
Readiness should reflect flat inventory condition, not just quantity.

Examples:
- Missing required critical asset -> `critical_asset_status = blocked`.
- Damaged but non-critical item -> usually `attention_required`.
- Missing required consumable below minimum threshold -> `consumables_status = attention_required` or `blocked` based on policy.

## Alerting Relationship
Readiness supports operational alerts:
- low stock
- missing required item
- damaged critical asset
- readiness-impacting issue

Alerts should include severity and flat scope to support staff action prioritization.

## Booking/Availability Relationship
- Readiness does not directly mutate reservation state.
- Readiness can produce warnings during booking flow and operations.
- `out_of_service` should trigger or strongly recommend manual availability blocking.
- Manual availability blocks remain the canonical mechanism for hard date unavailability in the current scope.

## Operational Workflow Expectations
- Staff should see component-level status and overall readiness together.
- Staff should see why a flat is not ready (clear reasons/notes).
- Staff actions should resolve component issues first, then remove any manual block when safe.

## Non-Goals For This Phase
- Full housekeeping suite
- Deep facility-management workflows
- Predictive maintenance systems
- Procurement and vendor lifecycles
