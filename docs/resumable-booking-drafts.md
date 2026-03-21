# Resumable Booking Drafts

## Purpose
Define implementation-ready rules for persisting and resuming in-progress booking data.
This document aligns with:
- `docs/booking-state-machine.md`
- `docs/booking-flow.md`
- `docs/payment-branch-rules.md`

## 1) What A Draft Is
A draft is in-progress booking data that can be resumed later.

Draft truth rules:
- A draft is not a confirmed booking.
- A draft is not a payment hold by default.
- A draft is not a calendar block by default.
- A draft does not reserve inventory by itself.
- Canonical draft status is `draft` unless the reservation has already moved into a branch-pending state.

## 2) What Is Persisted In A Draft
Minimum persisted fields:
- draft/reservation identifier (`id`)
- resumable token (`token` or resume token)
- stay details:
  - `flat_id`
  - `check_in`
  - `check_out`
  - `guests`
  - `extra_ids`
- guest details:
  - `first_name`
  - `last_name`
  - `email`
  - `phone`
  - `special_requests`
- selected payment method (`website`, `transfer`, `pos`, or null)
- canonical reservation status
- progress context needed for reliable resume:
  - branch context inferred from status + payment method
  - optional derived UI step pointer (non-canonical)
- timestamps:
  - `created_at`
  - `updated_at`
- transfer hold metadata only when applicable to an already-pending transfer reservation:
  - `transfer_hold_started_at`
  - `transfer_hold_expires_at`

Notes:
- Pricing snapshot may be persisted for continuity, but must remain recomputable from canonical stay/extras rules.
- Progress indicator state should be reconstructed from persisted booking truth, not trusted from client-only local step memory.

## 3) What Happens On Resume
When resuming with token/identifier:
1. Load draft/reservation snapshot from backend.
2. Rebuild branch context from canonical status + payment method.
3. Rebuild summary from persisted stay, extras, and guest details.
4. Restore progress indicator labels for the active branch.
5. Restore the correct next actionable step.

Resume reconstruction rules:
- Shared steps remain:
  - Stay Details
  - Guest Details
  - Payment Method
- Branch-specific downstream steps are recalculated per payment method.
- End-state wording must remain truthful to branch/state:
  - website -> `Booking Confirmed` only when `confirmed`
  - transfer pending -> `Awaiting Payment Confirmation`
  - pos pending -> `Reservation Request Submitted`

## 4) Availability Recheck Rules
Availability rules on resume:
- Drafts do not reserve dates.
- Dates can become unavailable between save and resume.
- Resume must trigger availability rechecks before meaningful transitions.

Required gating checkpoints remain:
- `stay_details_entry`
- `pre_hold_request`
- `pre_online_payment_handoff`
- `pre_transfer_confirmation`
- `pre_pos_confirmation`

If availability fails after resume:
- block the transition
- show a calm, clear message that dates are no longer available
- guide user to update stay details and continue

## 5) Branch Behavior On Resume
### Website Branch
- Resume with website flow structure:
  - Review & Checkout -> Payment Portal -> Booking Confirmed
- Do not treat resumed draft as payment success.
- Confirmation still requires verified successful website payment outcome.

### Transfer Branch
- Resume with transfer flow structure:
  - Review Reservation -> Transfer Details -> Awaiting Payment Confirmation
- If status is transfer-pending, hold timing remains authoritative from backend timestamps.
- No new hold is created just by opening/resuming the draft.

### POS Branch
- Resume with POS flow structure:
  - Review Reservation -> POS Coordination -> Reservation Request Submitted
- Pending POS state remains pending until POS payment completion is confirmed by staff path.

### Payment Method Change After Resume
- Preserve shared data.
- Reset branch-specific transient state.
- Rebuild downstream branch steps.
- Clear stale branch-specific errors/messages.
- Keep canonical transition rules intact (no bypassing state machine).

## 6) Draft Lifecycle
Supported lifecycle actions:
1. Create draft
- Save initial booking data in `draft` context.

2. Update draft
- Persist incremental edits while allowed by status rules.

3. Resume draft
- Load by token/identifier and reconstruct branch + next step.

4. Abandon draft
- User stops without completing; no inventory hold is implied.

5. Optional future stale-draft expiry
- Stale draft cleanup may be added later as housekeeping.
- Expiry policy is optional and must not invent new reservation-state rules.

## Implementation Guardrails
- Keep state-machine truth server-side.
- Do not imply inventory reservation from draft presence.
- Keep route handlers thin; domain rules stay in services/helpers.
- Keep TypeScript strict and avoid `any`.
- No auth expansion in this scope.
- No notifications expansion in this scope.
