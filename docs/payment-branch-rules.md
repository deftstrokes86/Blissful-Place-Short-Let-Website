# Payment Branch Rules

## Purpose
This document defines branch-specific payment rules for website payment, bank transfer, and POS.
It is the source of truth for payment branching behavior, hold handling, and confirmation truthfulness.

## Business Rules
## Canonical Reservation Statuses Used by Payment Branches
- `draft`
- `pending_online_payment`
- `pending_transfer_submission`
- `awaiting_transfer_verification`
- `pending_pos_coordination`
- `confirmed`
- `expired`
- `cancelled`
- `failed_payment`

## Branch Comparison
| Branch | User Flow End Label | Pending Status Path | Confirmed Only When |
|---|---|---|---|
| Website payment | `Booking Confirmed` | `draft` -> `pending_online_payment` | Payment portal success + required availability re-check passes |
| Bank transfer | `Awaiting Payment Confirmation` | `draft` -> `pending_transfer_submission` -> `awaiting_transfer_verification` | Staff confirms transfer proof + required availability re-check passes |
| POS | `Reservation Request Submitted` | `draft` -> `pending_pos_coordination` | POS payment is completed by staff coordination + required availability re-check passes |

## Website Payment Rules
- Flow uses Payment Portal after review.
- The system must support these outcomes:
- Payment Cancelled
- Payment Failed
- Try Again
- Switch Payment Method
- Contact Support

## Website Allowed Outcomes
- Success -> `confirmed`
- Payment failed -> `failed_payment`
- Payment cancelled -> `cancelled`
- Try Again from failed payment -> `pending_online_payment`
- Switch method from failed payment -> transfer or POS branch pending state

## Bank Transfer Rules
- Flow ends with `Awaiting Payment Confirmation` wording.
- Transfer hold lasts at most 1 hour.
- Proof of transfer must be received and confirmed by staff within that same 1 hour.
- If this condition is not met, reservation is `cancelled`.

## Bank Transfer Allowed Outcomes
- Proof submitted in window -> `awaiting_transfer_verification`
- Staff verified + availability re-check -> `confirmed`
- Not received/confirmed in window -> `cancelled`

## POS Rules
POS means:
- staff-assisted card payment coordination
- user submits reservation request
- support reaches out
- payment is arranged
- reservation becomes confirmed only after POS payment is completed

## POS Allowed Outcomes
- Request created -> `pending_pos_coordination`
- Payment completed + availability re-check -> `confirmed`
- Cancellation path -> `cancelled`

## Confirmation Truthfulness Rules
- Do not claim confirmation unless status is `confirmed`.
- Use locked end-state wording exactly:
- Website payment -> `Booking Confirmed`
- Bank transfer -> `Awaiting Payment Confirmation`
- POS -> `Reservation Request Submitted`
- For transfer and POS, user-visible completion of branch UI is not confirmation by itself.

## Availability Checkpoints
- When stay details are entered.
- Before creating any hold/request.
- Before online payment handoff.
- Before confirming transfer-related reservation state.
- Before confirming POS-related reservation state.

## Branch Reset Rule (Payment Method Changes)
- Preserve shared data.
- Discard branch-specific transient state.
- Rebuild downstream steps.
- Clear stale branch errors/messages.

## Forbidden Transitions and Claims
- No direct `draft` -> `confirmed`.
- No `pending_transfer_submission` -> `confirmed` without verification.
- No `pending_pos_coordination` -> `confirmed` without completed POS payment.
- No stale branch messaging after payment method switch.
- No transfer hold continuation beyond 1 hour without required proof receipt and staff confirmation.

## Technical Implications
- Branch logic should be implemented as explicit event-driven transitions.
- Backend should guard transitions by current status and event validity.
- UI should map branch state to user wording without overstating confirmation.

## Implementation Notes
- Use idempotency key per submission.
- Enforce loading state and duplicate-submit prevention while requests are in flight.
- Implement resumability using saved reservation draft or URL-safe booking token and server-side pending-state lookup.
