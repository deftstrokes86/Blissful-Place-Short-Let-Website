# Booking State Machine

## Purpose
This document is the reservation-state source of truth for booking.
It defines canonical statuses, events, allowed transitions, and forbidden transitions.

## Business Rules

### Two-Layer Model
- The system has two layers: `UI flow state` and `reservation state`.
- UI flow state controls what the user sees.
- Reservation state controls canonical booking truth.
- UI progression never overrides reservation-state truth.

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

### Status Definitions
| Status | Meaning |
|---|---|
| `draft` | Booking details exist, but no active payment-branch pending state exists yet. |
| `pending_online_payment` | Website payment branch is active and waiting for payment portal outcome. |
| `pending_transfer_submission` | Bank transfer branch is active and waiting for proof submission. |
| `awaiting_transfer_verification` | Proof was submitted and staff verification is pending. |
| `pending_pos_coordination` | POS branch is active and staff coordination is pending. |
| `confirmed` | Reservation is confirmed after branch-required completion and required availability checks. |
| `expired` | Canonical status reserved for expiry handling; transition policy is intentionally not defined in this approved scope. |
| `cancelled` | Reservation was cancelled by user/system/staff, including transfer hold timeout outcomes. |
| `failed_payment` | Website payment attempt failed. |

### Event Model
| Event | Description |
|---|---|
| `stay_details_submitted` | User enters stay details; availability checkpoint must run. |
| `payment_method_selected` | User selects website, bank transfer, or POS branch. |
| `branch_request_created` | Hold/request is created for selected branch after availability checkpoint pass. |
| `online_payment_handoff_requested` | Payment portal handoff is requested after availability checkpoint pass. |
| `online_payment_confirmed` | Payment portal reports success. |
| `online_payment_cancelled` | Payment portal flow is cancelled. |
| `online_payment_failed` | Payment portal reports failure. |
| `try_online_payment_again` | Retry website payment after `failed_payment`. |
| `switch_payment_method` | Payment method changes and branch reset rule is applied. |
| `transfer_proof_submitted` | Transfer proof is submitted in hold window. |
| `transfer_verified` | Staff verifies transfer in the same hold window. |
| `transfer_hold_expired` | 1-hour transfer hold window expires before required completion. |
| `pos_payment_completed` | Staff-assisted POS payment is completed. |
| `cancel_requested` | Cancellation is requested by user/system/staff. |

### Allowed Transitions
| From | Event and Condition | To |
|---|---|---|
| `draft` | `payment_method_selected=website` + `branch_request_created` + availability pass | `pending_online_payment` |
| `draft` | `payment_method_selected=bank_transfer` + `branch_request_created` + availability pass | `pending_transfer_submission` |
| `draft` | `payment_method_selected=pos` + `branch_request_created` + availability pass | `pending_pos_coordination` |
| `draft` | `cancel_requested` | `cancelled` |
| `pending_online_payment` | `online_payment_handoff_requested` + availability pass | `pending_online_payment` |
| `pending_online_payment` | `online_payment_confirmed` | `confirmed` |
| `pending_online_payment` | `online_payment_failed` | `failed_payment` |
| `pending_online_payment` | `online_payment_cancelled` | `cancelled` |
| `failed_payment` | `try_online_payment_again` + availability pass | `pending_online_payment` |
| `failed_payment` | `switch_payment_method=bank_transfer` + branch reset + availability pass | `pending_transfer_submission` |
| `failed_payment` | `switch_payment_method=pos` + branch reset + availability pass | `pending_pos_coordination` |
| `failed_payment` | `cancel_requested` | `cancelled` |
| `pending_transfer_submission` | `transfer_proof_submitted` within 1-hour hold | `awaiting_transfer_verification` |
| `pending_transfer_submission` | `transfer_hold_expired` | `cancelled` |
| `pending_transfer_submission` | `cancel_requested` | `cancelled` |
| `awaiting_transfer_verification` | `transfer_verified` within the same 1-hour hold + availability pass | `confirmed` |
| `awaiting_transfer_verification` | `transfer_hold_expired` | `cancelled` |
| `awaiting_transfer_verification` | `cancel_requested` | `cancelled` |
| `pending_pos_coordination` | `pos_payment_completed` + availability pass | `confirmed` |
| `pending_pos_coordination` | `cancel_requested` | `cancelled` |

### Forbidden Transitions
- Any status to `confirmed` without branch-required completion and required availability pass.
- `pending_transfer_submission` to `confirmed` directly.
- `awaiting_transfer_verification` to `confirmed` after hold expiry.
- `pending_pos_coordination` to `confirmed` without `pos_payment_completed`.
- `failed_payment` to `confirmed` directly.
- `pending_online_payment` to `confirmed` without `online_payment_confirmed`.
- `draft` to `awaiting_transfer_verification` directly.
- `draft` to `failed_payment` directly.
- `cancelled` to any pending status directly.
- `confirmed` to any pending status directly.

### Transfer Hold Implications
- The transfer hold window is a single 1-hour timer.
- The timer starts when transfer hold/request is created.
- Moving from `pending_transfer_submission` to `awaiting_transfer_verification` does not reset the timer.
- If proof is not both received and staff-confirmed inside that same timer, result is `cancelled`.

### Availability Checkpoints
- When stay details are entered.
- Before creating any hold/request.
- Before online payment handoff.
- Before confirming transfer-related reservation state.
- Before confirming POS-related reservation state.

### Non-Negotiable Checkpoints
- Checkpoint failures must block progression into the next reservation transition.
- Availability checks are gating checks, not informational hints.
- UI cannot bypass these checkpoints and still claim branch completion.

### Branch Reset Rule (When Payment Method Changes)
- Preserve shared data.
- Discard branch-specific transient state.
- Rebuild downstream steps.
- Clear stale branch errors/messages.
- In this approved scope, explicit switch transition is defined for `failed_payment` recovery; additional mid-pending switch paths require separate approval.

### Branch-Specific End States (Locked UI Wording)
- Website payment -> `Booking Confirmed`
- Bank transfer -> `Awaiting Payment Confirmation`
- POS -> `Reservation Request Submitted`

### Website Payment Required Outcomes
- Payment Cancelled
- Payment Failed
- Try Again
- Switch Payment Method
- Contact Support

### Extras Pricing Rule
- Extras are flat fee only.

## Technical Implications
- Implement reservation status changes as guarded, event-driven transitions.
- Keep UI flow state separate from reservation state.
- Enforce availability and timing gates server-side before transition commits.

## Implementation Notes
- Use an idempotency key per submission.
- Show loading state on submit buttons.
- Disable repeated submission while a request is in flight.
- Support resumability via saved draft or URL-safe booking token with server-side pending-state lookup.


