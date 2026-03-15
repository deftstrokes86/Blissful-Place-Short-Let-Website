# Booking State Machine

## Purpose
This document defines the source-of-truth state machine for booking in this project.
It covers the two required system layers:

- UI flow state
- reservation state

## Business Rules
## Two-Layer Model
- UI flow state controls what step the user sees and what actions are available.
- Reservation state controls the canonical backend truth of a reservation attempt.
- UI step changes must never overwrite canonical reservation truth.

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

## Extras Pricing Rule
- Extras are flat fee only.

## State Definitions
| Status | Meaning |
|---|---|
| `draft` | In-progress booking data; no finalized payment outcome yet. |
| `pending_online_payment` | User has selected website payment and has been handed off to payment portal flow. |
| `pending_transfer_submission` | User has selected transfer and reservation is waiting for transfer proof submission. |
| `awaiting_transfer_verification` | Transfer proof received; staff verification is pending. |
| `pending_pos_coordination` | User selected POS; support coordination is required before payment completion. |
| `confirmed` | Reservation is fully confirmed after required branch-specific payment completion checks. |
| `expired` | Time-bounded pending attempt became invalid due timeout policy. |
| `cancelled` | User/system/staff cancellation, including transfer hold timeout rule. |
| `failed_payment` | Website payment attempt failed. |

## Event Model
| Event | Description |
|---|---|
| `submit_stay_details` | User provides stay details; triggers availability check. |
| `select_payment_method` | User chooses website, transfer, or POS branch. |
| `create_branch_request` | System creates hold/request for selected payment branch. |
| `handoff_online_payment` | System hands off to payment portal after re-checking availability. |
| `online_payment_confirmed` | Payment portal confirms payment success. |
| `online_payment_cancelled` | User cancels payment in portal. |
| `online_payment_failed` | Payment attempt fails. |
| `transfer_proof_submitted` | User submits transfer proof. |
| `transfer_verified` | Staff verifies transfer proof. |
| `transfer_not_verified_or_timeout` | Proof not confirmed within required window. |
| `pos_payment_completed` | Staff-assisted POS payment completed. |
| `payment_method_changed` | User switches branch; branch reset rule applies. |
| `cancel_request` | User or staff cancels reservation attempt. |

## Allowed Transitions
| From | Event/Condition | To |
|---|---|---|
| `draft` | `select_payment_method=website` + availability pass + request created | `pending_online_payment` |
| `draft` | `select_payment_method=transfer` + availability pass + hold created | `pending_transfer_submission` |
| `draft` | `select_payment_method=pos` + availability pass + request created | `pending_pos_coordination` |
| `draft` | `cancel_request` | `cancelled` |
| `pending_online_payment` | `online_payment_confirmed` + availability pass | `confirmed` |
| `pending_online_payment` | `online_payment_failed` | `failed_payment` |
| `pending_online_payment` | `online_payment_cancelled` | `cancelled` |
| `pending_online_payment` | session timeout policy | `expired` |
| `failed_payment` | `handoff_online_payment` (Try Again) + availability pass | `pending_online_payment` |
| `failed_payment` | `payment_method_changed=transfer` + branch reset + availability pass | `pending_transfer_submission` |
| `failed_payment` | `payment_method_changed=pos` + branch reset + availability pass | `pending_pos_coordination` |
| `failed_payment` | `cancel_request` | `cancelled` |
| `pending_transfer_submission` | `transfer_proof_submitted` within 1 hour hold | `awaiting_transfer_verification` |
| `pending_transfer_submission` | proof not received and confirmed within 1 hour | `cancelled` |
| `pending_transfer_submission` | `cancel_request` | `cancelled` |
| `awaiting_transfer_verification` | `transfer_verified` + availability pass | `confirmed` |
| `awaiting_transfer_verification` | `transfer_not_verified_or_timeout` | `cancelled` |
| `pending_pos_coordination` | `pos_payment_completed` + availability pass | `confirmed` |
| `pending_pos_coordination` | `cancel_request` | `cancelled` |
| `expired` | resume flow from saved draft/token | `draft` |

## Forbidden Transitions
- Any status -> `confirmed` without branch-specific payment completion.
- `pending_transfer_submission` -> `confirmed` without transfer verification.
- `pending_pos_coordination` -> `confirmed` without completed POS payment.
- `failed_payment` -> `confirmed` directly.
- `cancelled` -> any pending status directly.
- `confirmed` -> any pending status.
- `draft` -> `awaiting_transfer_verification` directly.
- `draft` -> `failed_payment` directly.

## Availability Checkpoints
- On stay details entry/update.
- Before creating any hold/request.
- Before online payment handoff.
- Before confirming transfer-related reservation state.
- Before confirming POS-related reservation state.

## Branch-Specific End States (UI Wording Lock)
- Website payment: `Booking Confirmed`
- Bank transfer: `Awaiting Payment Confirmation`
- POS: `Reservation Request Submitted`

## Technical Implications
- UI flow step state and reservation status state must be modeled separately.
- Reservation status updates should be event-driven and validated against allowed transitions.
- Branch change handling must apply the branch reset rule.
- Preserve shared data.
- Discard branch-specific transient state.
- Rebuild downstream steps.
- Clear stale branch errors/messages.
- Website payment outcomes must support Payment Cancelled, Payment Failed, Try Again, Switch Payment Method, and Contact Support.

## Implementation Notes
- Use idempotency key per submission event.
- Submit buttons must show loading state.
- Repeated submit attempts must be disabled while requests are in flight.
- Production flow must support resumability from saved draft or URL-safe booking token with server-side pending-state lookup.
