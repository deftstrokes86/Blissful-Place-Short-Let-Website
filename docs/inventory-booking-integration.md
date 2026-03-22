# Inventory and Booking Integration

## Purpose
Define how inventory/readiness influences booking operations without breaking booking-state truth boundaries.

## Core Integration Principle
Inventory and readiness must never directly mutate reservation status.
Reservation transitions remain controlled by the booking state machine and reservation services.

## Truth Boundaries
- Reservation truth: booking state machine and reservation domain services.
- Calendar availability truth: availability blocks and overlap checks.
- Operational readiness truth: readiness/inventory services.

Each layer informs the others through explicit service boundaries, not implicit side effects.

## Booking Influence Rules
1. Inventory/readiness may produce warnings and operational guidance.
2. Critical readiness failure may trigger or recommend manual availability blocks.
3. Manual blocks (when active) prevent bookings via availability queries.
4. Removing readiness issues does not auto-confirm reservations.
5. Inventory updates do not auto-cancel reservations.

## Out-of-Service Handling
If a flat is `out_of_service`:
- It should not remain casually bookable.
- Operations should create or keep an active manual hard block for affected dates.
- Booking UI/backend should surface clear unavailability results from availability services.

In this phase, operational protection should happen through manual availability-block flows, not hidden reservation-state mutation.

## Reservation-Driven Blocks and Manual Blocks
Reservation blocks and manual blocks must coexist safely:
- Reservation-driven blocks come from reservation lifecycle sync.
- Manual blocks come from staff operations.
- Neither source should overwrite or delete the other source.

Availability decision remains flat-specific and date-range-specific.

## Availability Checkpoint Integration
At required booking checkpoints (stay entry, pre-hold, pre-confirmation paths), availability services should consider:
- reservation hard blocks
- active transfer soft holds
- active manual hard blocks

Readiness can additionally provide warning context, but blocking remains calendar-block-based in current scope.

## Recommended Service Interaction Pattern
1. Reservation flow calls availability service.
2. Availability service evaluates calendar blocks.
3. Optional readiness service call enriches response with operational warning metadata.
4. Reservation flow decides allowed/blocked progression based on booking rules.
5. Staff uses manual block actions when operational conditions require hard unavailability.

## Suggested Integration Events
Useful operational events for implementation:
- `readiness_became_out_of_service`
- `readiness_recovered`
- `critical_asset_reported_damaged`
- `required_item_missing`

Event handling guidance:
- Events should create alerts/tasks.
- Events may recommend manual blocking.
- Events must not directly force reservation status changes.

## Safety Rules
- No direct inventory-to-reservation status mutation.
- No silent deletion of reservation-driven availability blocks.
- No automatic confirmation based on inventory checks.
- Manual block removal should reopen availability only when no other active overlapping block exists.

## Admin UX Expectations
- Booking/admin tools should clearly separate:
  - reservation status
  - calendar block status
  - readiness status
- Staff should see actionable guidance when readiness risks affect booking operations.
- Wording must remain truthful (for example, warning vs confirmed).

## Phase Non-Goals
- External calendar sync
- Supplier/procurement coupling
- Automatic repricing based on inventory
- Autonomous reservation migration between flats
