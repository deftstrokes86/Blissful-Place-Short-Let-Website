# Booking Flow

## Purpose
This document defines the user-facing booking journey and step behavior.
It is implementation-ready guidance for frontend flow control while staying aligned with canonical reservation states.

## Business Rules
## Two-Layer Model
- UI flow state controls step progression and what is shown to the user.
- Reservation state controls backend truth and must use canonical statuses.
- UI completion of a step is not confirmation unless reservation state supports it.

## Shared Flow Stages
- Stay Details
- Guest Details
- Payment Method

## Branch A: Website Payment
## User Journey
1. Stay Details
2. Guest Details
3. Payment Method
4. Review & Checkout
5. Payment Portal
6. Booking Confirmed

## Reservation-State Direction
- Before payment handoff: `pending_online_payment`
- On payment success and final availability re-check: `confirmed`
- On payment failure: `failed_payment`
- On payment cancellation: `cancelled`

## Required Website Payment Outcomes
- Payment Cancelled
- Payment Failed
- Try Again
- Switch Payment Method
- Contact Support

## Branch B: Bank Transfer
## User Journey
1. Stay Details
2. Guest Details
3. Payment Method
4. Review Reservation
5. Transfer Details
6. Awaiting Payment Confirmation

## Reservation-State Direction
- On branch request creation: `pending_transfer_submission`
- After proof submission: `awaiting_transfer_verification`
- After staff verification and final availability re-check: `confirmed`
- If proof is not received and confirmed within 1 hour: `cancelled`

## Transfer Hold Rule
- Hold lasts at most 1 hour.
- Proof of transfer must be received and confirmed by staff within that 1 hour.
- Otherwise reservation is cancelled.

## Branch C: POS
POS means:
- staff-assisted card payment coordination
- user submits reservation request
- support reaches out
- payment is arranged
- reservation becomes confirmed only after POS payment is completed

## User Journey
1. Stay Details
2. Guest Details
3. Payment Method
4. Review Reservation
5. POS Coordination
6. Reservation Request Submitted

## Reservation-State Direction
- On request creation: `pending_pos_coordination`
- After completed POS payment and final availability re-check: `confirmed`

## Branch Reset Rule (When Payment Method Changes)
- Preserve shared data.
- Discard branch-specific transient state.
- Rebuild downstream steps.
- Clear stale branch errors/messages.

## Step Indicator Logic
- Steps 1-3 are shared.
- Step 4 label is branch-specific (`Review & Checkout` for website, `Review Reservation` for transfer/POS).
- Step 5 and step 6 are branch-specific.
- Changing payment method at or after step 3 must recalculate downstream steps.
- Step indicator must never imply confirmation before reservation status allows it.

## Availability Checkpoints
- When stay details are entered.
- Again before creating any hold/request.
- Again before online payment handoff.
- Again before confirming transfer-related reservation state.
- Again before confirming POS-related reservation state.

## Extras Pricing Rule
- Extras are flat fee only.

## Branch-Specific End States (Locked Wording)
- Website payment -> `Booking Confirmed`
- Bank transfer -> `Awaiting Payment Confirmation`
- POS -> `Reservation Request Submitted`

## Forbidden Flow Behavior
- Do not skip required intermediate steps for a selected branch.
- Do not keep stale branch-specific errors after payment method switch.
- Do not display `Booking Confirmed` for transfer or POS before verified/completed payment.
- Do not create hold/request without the required availability re-check.

## Technical Implications
- Frontend must model step state independently from reservation status.
- Step transitions should be event-driven and branch-aware.
- Branch changes must reset branch-only UI/cache safely.
- Availability checks should be explicit action gates, not passive UI hints.

## Implementation Notes
- Use idempotency key per submission.
- Show loading states on submit buttons.
- Disable repeated submission while request is in flight.
- Support resumable flow via saved draft or URL-safe booking token with server-side pending-state lookup.
