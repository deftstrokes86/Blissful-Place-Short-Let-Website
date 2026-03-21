# Notification Events

## Purpose
This document defines notification events for the current booking MVP.
It maps reservation/domain events to guest/staff notification intents with strict truth rules.

## Event Model
Notification pipeline:
1. domain transition/event occurs
2. notification intent is derived
3. channel delivery attempt is recorded

Domain transitions must come from backend service/state-machine boundaries, not UI assumptions.

## Guest-Facing Events (This Phase)

### 1) Reservation Request Received
- Trigger: reservation enters a pending branch state after request creation
- Reservation states:
  - `pending_online_payment`
  - `pending_transfer_submission`
  - `pending_pos_coordination`
- Intent examples:
  - website: "Reservation request received" + next step to complete online payment
  - transfer: "Reservation request received" + transfer instructions
  - pos: "Reservation request submitted" + coordination expectation

### 2) Transfer Instructions / Transfer Pending Confirmation
- Trigger: transition to `pending_transfer_submission`
- Reservation status required: `pending_transfer_submission`
- Must include hold window context (1-hour policy) where applicable

### 3) Transfer Verified and Booking Confirmed
- Trigger: transfer verification transition that sets reservation to `confirmed`
- Reservation status required: `confirmed`
- Payment method context: `transfer`

### 4) POS Reservation Request Submitted
- Trigger: transition to `pending_pos_coordination`
- Reservation status required: `pending_pos_coordination`

### 5) POS Payment Confirmed and Booking Confirmed
- Trigger: POS completion transition that sets reservation to `confirmed`
- Reservation status required: `confirmed`
- Payment method context: `pos`

### 6) Reservation Cancelled
- Trigger: transition to `cancelled`
- Reservation status required: `cancelled`

### 7) Reservation Expired / Hold Expired
- Trigger: transfer-hold expiry or reservation expiry handling
- Reservation status required:
  - `expired` when explicit expiry policy uses canonical expired state
  - or `cancelled` when transfer hold expiry maps to cancellation per current approved transitions
- Messaging must state the actual resulting reservation status truthfully

## Staff-Facing Events (This Phase)

### 1) New Pending Transfer Reservation
- Trigger: transition to `pending_transfer_submission`
- Used to populate/notify transfer queue

### 2) Transfer Proof Submitted
- Trigger: transition to `awaiting_transfer_verification`
- Used to request staff verification action

### 3) New Pending POS Reservation
- Trigger: transition to `pending_pos_coordination`
- Used to populate/notify POS coordination queue

### 4) Reservation Cancelled
- Trigger: transition to `cancelled`
- Used for operational visibility and cleanup follow-up

### 5) Reservation Confirmed
- Trigger: transition to `confirmed`
- Used for operational closure and downstream handoff

### 6) Hold Nearing Expiry (Optional Later)
- Not required in this phase
- Can be added as a scheduled operational alert if easy later

## Truth Mapping Rules
- Never map to "confirmed" notification unless reservation status is `confirmed`.
- Never map transfer confirmation notice before `transfer_verified` transition outcome is committed.
- Never map POS confirmation notice before `pos_payment_completed` transition outcome is committed.
- Notification templates must be keyed by reservation-state truth + branch context.

## Recommended Intent Keys (Implementation Direction)
Guest intents:
- `reservation_request_received`
- `transfer_payment_pending`
- `transfer_payment_confirmed`
- `pos_request_submitted`
- `pos_payment_confirmed`
- `reservation_cancelled`
- `reservation_expired_or_hold_expired`

Staff intents:
- `staff_transfer_pending_created`
- `staff_transfer_proof_submitted`
- `staff_pos_pending_created`
- `staff_reservation_cancelled`
- `staff_reservation_confirmed`
- `staff_transfer_hold_nearing_expiry` (optional later)

## Delivery Status Expectations
Each notification delivery attempt should be trackable as:
- `queued`
- `sent`
- `failed`

Retry handling:
- retryable strategy can be introduced later for `failed`
- do not duplicate customer-visible effects on repeated processing

## Non-Goals (This Phase)
- no marketing campaigns or broadcast automation
- no notification preferences management UI
- no external WhatsApp/SMS delivery adapters
- no full conversational inbox system

## Alignment Notes
- This event catalog aligns with the canonical booking statuses and transition rules in `docs/booking-state-machine.md`.
- Transfer hold expiry currently transitions to `cancelled` in approved transition paths; notification wording must reflect that truth.
- If a future policy begins using `expired` transitions directly, add explicit event mappings without changing existing truth rules.
