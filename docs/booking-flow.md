# Booking Flow

## Purpose
This document defines the implementation-ready user journey for booking.
It specifies branch-specific steps and how UI flow state must align with reservation state.

## Business Rules

### Two-Layer Model
- The system has two layers: `UI flow state` and `reservation state`.
- UI flow state controls step indicator and view progression.
- Reservation state is canonical truth and controls whether a booking is pending or confirmed.

### Canonical Reservation Statuses Used by Flow
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

### Shared Steps
1. Stay Details
2. Guest Details
3. Payment Method

### Branch A: Website Payment
Flow:
1. Stay Details
2. Guest Details
3. Payment Method
4. Review & Checkout
5. Payment Portal
6. Booking Confirmed

State alignment:
- Request creation after availability pass -> `pending_online_payment`
- Payment success -> `confirmed`
- Payment failed -> `failed_payment`
- Payment cancelled -> `cancelled`

Required website outcomes:
- Payment Cancelled
- Payment Failed
- Try Again
- Switch Payment Method
- Contact Support

### Branch B: Bank Transfer
Flow:
1. Stay Details
2. Guest Details
3. Payment Method
4. Review Reservation
5. Transfer Details
6. Awaiting Payment Confirmation

State alignment:
- Request creation after availability pass -> `pending_transfer_submission`
- Proof submitted in hold window -> `awaiting_transfer_verification`
- Staff verification in same hold window plus final availability pass -> `confirmed`
- Hold expiry before required completion -> `cancelled`

Transfer hold rule:
- Hold lasts at most 1 hour.
- The timer starts when transfer hold/request is created.
- Proof of transfer must be received and confirmed by staff within that same 1 hour.
- Moving to `awaiting_transfer_verification` does not reset the timer.
- Otherwise reservation is cancelled.

### Branch C: POS
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

State alignment:
- Request creation after availability pass -> `pending_pos_coordination`
- Reservation remains pending until POS payment completes.
- POS payment completion plus final availability pass -> `confirmed`

### Branch End Labels vs Confirmation Truth
- `Booking Confirmed` must only render when reservation state is `confirmed`.
- `Awaiting Payment Confirmation` is a pending transfer label, not confirmation.
- `Reservation Request Submitted` is a pending POS label, not confirmation.

### Branch Reset Rule (When Payment Method Changes)
- Preserve shared data.
- Discard branch-specific transient state.
- Rebuild downstream steps.
- Clear stale branch errors/messages.
- In this approved scope, explicit switch transition is defined for `failed_payment` recovery; additional mid-pending switch paths require separate approval.
- Reset examples: payment-portal session references, transfer-proof upload state, POS coordination messages.

### Allowed Transitions
- Shared steps 1-3 are common to all branches.
- Step 4 onward follows the selected payment branch.
- From `failed_payment`, user may Try Again in website flow or Switch Payment Method to transfer/POS.
- Changing payment method at or after step 3 must rebuild branch-specific steps before continuing.

### Forbidden Transitions
- Do not skip required intermediate steps for the selected branch.
- Do not show branch end labels from a different branch.
- Do not preserve stale branch-specific errors/messages after branch switch.
- Do not display confirmation claims unless reservation state is `confirmed`.

### Step Indicator Logic
- Steps 1-3 are always shared.
- Step 4 label is branch-specific.
- Website step 4: `Review & Checkout`.
- Transfer and POS step 4: `Review Reservation`.
- Steps 5-6 are branch-specific and must be recalculated when payment method changes.
- UI step completion is not reservation confirmation by itself.

### Availability Checkpoints
- When stay details are entered.
- Before creating any hold/request.
- Before online payment handoff.
- Before confirming transfer-related reservation state.
- Before confirming POS-related reservation state.

### Non-Negotiable Checkpoints
- Checkpoint failure blocks progression to the next booking step.
- Online payment handoff must not execute without fresh availability pass.
- Transfer/POS confirmation must not execute without final availability pass.

### Extras Pricing Rule
- Extras are flat fee only.

### Branch-Specific End States (Locked Wording)
- Website payment -> `Booking Confirmed`
- Bank transfer -> `Awaiting Payment Confirmation`
- POS -> `Reservation Request Submitted`

## Technical Implications
- Implement UI step control and reservation status as separate state machines.
- Drive status updates from backend-confirmed events, not just front-end step completion.
- Ensure branch reset logic clears transient branch-only data deterministically.

## Implementation Notes
- Use an idempotency key per submission.
- Show loading state on submit buttons.
- Disable repeated submission while request is in flight.
- Support resumability via saved draft or URL-safe booking token with server-side lookup for pending state.


