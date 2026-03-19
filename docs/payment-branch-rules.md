# Payment Branch Rules

## Purpose
This document defines website payment, bank transfer, and POS branch rules.
It is the implementation reference for branch behavior, hold logic, and confirmation truthfulness.

## Business Rules

### Canonical Reservation Statuses
- `draft`
- `pending_online_payment`
- `pending_transfer_submission`
- `awaiting_transfer_verification`
- `pending_pos_coordination`
- `confirmed`
- `expired`
- `cancelled`
- `failed_payment`

Scope note:
- `expired` is canonical, but transition policy for entering `expired` is outside this approved scope.

### Branch Summary
| Branch | Locked UI End Label | Pending Path | Becomes `confirmed` Only When |
|---|---|---|---|
| Website payment | `Booking Confirmed` | `draft` -> `pending_online_payment` | Payment portal reports success |
| Bank transfer | `Awaiting Payment Confirmation` | `draft` -> `pending_transfer_submission` -> `awaiting_transfer_verification` | Proof is received and staff-confirmed within 1 hour, then final availability pass succeeds |
| POS | `Reservation Request Submitted` | `draft` -> `pending_pos_coordination` | Staff-assisted POS payment completes, then final availability pass succeeds |

### Website Payment Rules
Flow:
1. Stay Details
2. Guest Details
3. Payment Method
4. Review & Checkout
5. Payment Portal
6. Booking Confirmed

Required outcome handling:
- Payment Cancelled
- Payment Failed
- Try Again
- Switch Payment Method
- Contact Support

### Bank Transfer Rules
Flow:
1. Stay Details
2. Guest Details
3. Payment Method
4. Review Reservation
5. Transfer Details
6. Awaiting Payment Confirmation

Transfer hold rule:
- Hold lasts at most 1 hour.
- The timer starts when the transfer hold/request is created.
- Proof of transfer must be received and confirmed by staff within that same 1 hour.
- Moving to `awaiting_transfer_verification` does not reset the timer.
- Otherwise reservation is cancelled.

### POS Rules
POS means:
- staff-assisted card payment coordination
- user submits reservation request
- support reaches out
- payment is arranged
- reservation becomes confirmed only after POS payment is completed

Flow:
1. Stay Details
2. Guest Details
3. Payment Method
4. Review Reservation
5. POS Coordination
6. Reservation Request Submitted

### Allowed Transitions
- `draft` + website request creation -> `pending_online_payment`
- `pending_online_payment` + payment success -> `confirmed`
- `pending_online_payment` + payment failed -> `failed_payment`
- `pending_online_payment` + payment cancelled -> `cancelled`
- `failed_payment` + Try Again -> `pending_online_payment`
- `failed_payment` + Switch Payment Method -> transfer/POS pending path
- `failed_payment` + cancellation -> `cancelled`
- `draft` + transfer hold creation -> `pending_transfer_submission`
- `pending_transfer_submission` + proof submitted in hold window -> `awaiting_transfer_verification`
- `awaiting_transfer_verification` + staff verification in same hold window + final availability pass -> `confirmed`
- `pending_transfer_submission` or `awaiting_transfer_verification` + hold expiry before required completion -> `cancelled`
- `draft` + POS request creation -> `pending_pos_coordination`
- `pending_pos_coordination` + POS payment completion + final availability pass -> `confirmed`
- `pending_pos_coordination` + cancellation -> `cancelled`

### Forbidden Transitions
- No status may transition to `confirmed` without branch-required completion.
- No `pending_transfer_submission` may transition directly to `confirmed`.
- No transfer reservation may remain active past 1 hour without both proof receipt and staff confirmation.
- No `pending_pos_coordination` may transition to `confirmed` without POS payment completion.
- No `failed_payment` may transition directly to `confirmed`.

### Forbidden Claims
- No UI should claim confirmation unless reservation state is `confirmed`.
- `Awaiting Payment Confirmation` is a pending label, not confirmation.
- `Reservation Request Submitted` is a pending label, not confirmation.
- Do not use branch end-state wording outside its matching branch.

### Branch Reset Rule (When Payment Method Changes)
- Preserve shared data.
- Discard branch-specific transient state.
- Rebuild downstream steps.
- Clear stale branch errors/messages.
- In this approved scope, explicit switch transition is defined for `failed_payment` recovery; additional mid-pending switch paths require separate approval.

### Availability Checkpoints
- When stay details are entered.
- Before creating any hold/request.
- Before online payment handoff.
- Before confirming transfer-related reservation state.
- Before confirming POS-related reservation state.

### Non-Negotiable Checkpoints
- Availability checks are hard gates; failures block progression.
- Do not create branch holds/requests if availability check fails.
- Do not hand off to payment portal without fresh availability pass.
- Do not mark transfer/POS confirmations without final availability pass.

### Extras Pricing Rule
- Extras are flat fee only.

### Branch-Specific End States (Locked Wording)
- Website payment -> `Booking Confirmed`
- Bank transfer -> `Awaiting Payment Confirmation`
- POS -> `Reservation Request Submitted`

## Technical Implications
- Implement branch handling with explicit event-driven transitions.
- Enforce hold timing and transition guards server-side.
- Keep UI wording strictly aligned to reservation-state truth.
- Treat payment-method switch as reset + rebuild of branch-only state.

## Implementation Notes
- Use an idempotency key per submission.
- Show loading state on submit buttons.
- Disable repeated submission while request is in flight.
- Support resumability using saved draft or URL-safe booking token with server-side lookup for pending state.


