# Staff Operations (Booking Administration)

## Purpose
Define the staff-side booking actions for transfer and POS administration while preserving reservation-state truth.

## Scope
This document covers:
- staff queue visibility
- transfer verification
- POS payment confirmation
- staff cancellation
- hold-expiry visibility

Out of scope:
- role/permission matrix design
- external calendar sync
- payment gateway implementation details

## Source Of Truth
All staff actions must align with:
- `docs/booking-state-machine.md`
- `docs/booking-flow.md`
- `docs/payment-branch-rules.md`

## Canonical Reservation Statuses
- `draft`
- `pending_online_payment`
- `pending_transfer_submission`
- `awaiting_transfer_verification`
- `pending_pos_coordination`
- `confirmed`
- `expired`
- `cancelled`
- `failed_payment`

## Staff Action Catalog

### 1) View Pending Transfer Reservations
Queue includes reservations in:
- `pending_transfer_submission`
- `awaiting_transfer_verification`

Minimum queue fields:
- reservation id/token
- flat id
- check-in/check-out
- current status
- hold expiry timestamp
- hold-expired flag
- latest transfer reference/proof metadata (if present)

### 2) View Pending POS Reservations
Queue includes reservations in:
- `pending_pos_coordination`

Minimum queue fields:
- reservation id/token
- flat id
- check-in/check-out
- current status
- latest POS coordination metadata (contact window, requested time)

### 3) Verify Transfer
Input:
- reservation token
- staff id
- optional verification note
- idempotency key

Preconditions:
- reservation status must be `awaiting_transfer_verification`
- transfer hold window must still be valid
- required pre-confirmation availability check must pass

Outcome:
- allowed path: `awaiting_transfer_verification` -> `confirmed`
- expired hold path: transition to `cancelled` per state machine/hold rules

### 4) Confirm POS Payment
Input:
- reservation token
- staff id
- idempotency key

Preconditions:
- reservation status must be `pending_pos_coordination`
- required pre-confirmation availability check must pass

Outcome:
- allowed path: `pending_pos_coordination` -> `confirmed`

### 5) Cancel Reservation (Staff)
Input:
- reservation token
- idempotency key

Preconditions:
- cancellation must be allowed by state machine rules

Outcome:
- transition event: `cancel_requested`
- resulting status: `cancelled` where allowed

### 6) View Hold Expiry Times
Transfer queue must clearly show:
- `transferHoldExpiresAt`
- whether hold has expired
- urgency ordering (earliest expiry first)

## Safety Rules
1. No confirmation without the required payment path completion.
2. No transfer verification outside transfer-valid states.
3. No POS confirmation outside `pending_pos_coordination`.
4. No direct status writes that bypass state-machine transitions.
5. All mutating staff actions must be idempotent.
6. Route handlers must stay thin. Domain rules belong in services.

## Truthful UX Requirements For Staff Tools
- Use clear status labels matching canonical statuses.
- Always show transfer hold-expiry timestamps where relevant.
- Keep action labels concise, for example:
  - `Verify Transfer`
  - `Confirm POS Payment`
  - `Cancel Reservation`
- Do not use misleading confirmation language.
- `confirmed` wording is only valid when reservation status is `confirmed`.

## Implementation Notes
- Staff actions should call service-level operations that already enforce reservation transition guards.
- Queue and action responses should return canonical status after mutation.
- Keep audit metadata (actor, timestamp, note/reference) for staff actions.
