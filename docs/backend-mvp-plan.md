# Backend MVP Plan (Booking)

## Purpose
This plan translates the current booking architecture, state machine, and typed domain layer into an implementation-ready backend build sequence.
It is intentionally scoped for MVP delivery and does not introduce unapproved flows.

## Scope Guardrails
- Keep canonical statuses exactly as defined:
  - `draft`
  - `pending_online_payment`
  - `pending_transfer_submission`
  - `awaiting_transfer_verification`
  - `pending_pos_coordination`
  - `confirmed`
  - `expired`
  - `cancelled`
  - `failed_payment`
- Keep payment methods exactly as defined: `website`, `transfer`, `pos`.
- Extras pricing remains flat-fee only.
- No direct transitions to `confirmed` without branch-required completion + required availability pass.
- Payment-method switching in MVP is only explicit for failed website payment recovery (`failed_payment` -> transfer/POS path).

## MVP Outcomes
By end of MVP, backend must support:
- Draft create/update + resume by token.
- Website payment pending/confirm/fail/cancel lifecycle.
- Transfer hold lifecycle with 1-hour enforcement and staff verification.
- POS coordination lifecycle with staff completion to confirm.
- Availability rechecks at all required checkpoints.
- Safe retries via idempotency keys.
- Basic staff operations for transfer and POS completion.

## 1) Draft Persistence

### Backend actions
- `createDraft`
  - Creates booking draft with token.
  - Initializes status `draft`.
- `updateDraft`
  - Partial updates for stay/guest/payment method while status allows it.
  - Recomputes pricing snapshot from flat-fee extras logic.
- `getDraftByToken`
  - Returns draft/reservation state for resumability.

### Data expectations
- Persist at minimum:
  - `id`, `token`, `reservation_status`, `payment_method` (nullable)
  - stay details
  - guest details
  - pricing snapshot
  - timestamps (`created_at`, `updated_at`)

### Resumability behavior
- Token is sufficient to resume.
- Response should include canonical status + branch context + transfer hold remaining time (if transfer branch).
- Client must derive UI from canonical status, not local step memory.

## 2) Website Payment Flow

### Backend actions
- `createBranchRequest(payment_method=website)`
  - Preconditions: status `draft`; `pre_hold_request` availability pass.
  - Transition: `draft` -> `pending_online_payment`.
- `initiateWebsiteCheckout`
  - Preconditions: status `pending_online_payment`; fresh `pre_online_payment_handoff` availability pass.
  - Creates provider checkout/session reference.
- `handleWebsitePaymentOutcome`
  - Maps provider outcome to status:
    - success -> `confirmed`
    - failed -> `failed_payment`
    - cancelled -> `cancelled`

### Required mapping consistency
- `pending_online_payment` -> `confirmed` only on confirmed payment success event.
- Retry behavior:
  - `failed_payment` + try again -> `pending_online_payment` (with availability gate).
  - `failed_payment` + switch method -> transfer/POS pending path (with branch reset + availability gate).

## 3) Bank Transfer Flow

### Backend actions
- `createBranchRequest(payment_method=transfer)`
  - Preconditions: status `draft`; `pre_hold_request` availability pass.
  - Creates transfer hold and timestamps:
    - `hold_started_at`
    - `hold_expires_at = hold_started_at + 1 hour`
  - Transition: `draft` -> `pending_transfer_submission`.
- `submitTransferProof`
  - Preconditions: status `pending_transfer_submission`; hold still active.
  - Persist proof reference/metadata.
  - Transition: `pending_transfer_submission` -> `awaiting_transfer_verification`.
- `verifyTransferByStaff`
  - Preconditions:
    - status `awaiting_transfer_verification`
    - staff verification action
    - same hold still active
    - `pre_transfer_confirmation` availability pass
  - Transition: `awaiting_transfer_verification` -> `confirmed`.

### Automatic expiry rules
- Hold duration is one continuous 1-hour window from hold creation.
- Moving to `awaiting_transfer_verification` does not reset timer.
- If required completion does not occur before `hold_expires_at`, transition to `cancelled`.

## 4) POS Flow

### Backend actions
- `createBranchRequest(payment_method=pos)`
  - Preconditions: status `draft`; `pre_hold_request` availability pass.
  - Transition: `draft` -> `pending_pos_coordination`.
- `submitPosCoordinationRequest`
  - Persists contact window/coordination note.
  - Status remains `pending_pos_coordination`.
- `confirmPosPaymentByStaff`
  - Preconditions:
    - status `pending_pos_coordination`
    - staff marks payment complete
    - `pre_pos_confirmation` availability pass
  - Transition: `pending_pos_coordination` -> `confirmed`.

### Staff follow-up expectations
- Staff queue for pending POS requests.
- Contact attempts + notes timeline.
- Explicit payment completion action required for confirmation.

## 5) Availability Strategy

### Required checkpoints (all must be implemented)
- `stay_details_entry`
- `pre_hold_request`
- `pre_online_payment_handoff`
- `pre_transfer_confirmation`
- `pre_pos_confirmation`

### Enforcement rules
- Failed checkpoint blocks transition.
- No hold/request creation when `pre_hold_request` fails.
- No website handoff when `pre_online_payment_handoff` fails.
- No transfer/POS confirmation when final checkpoint fails.

## 6) Expiry and Cancellation Handling

### What expires
- Transfer hold (1 hour max) expires if proof+verification completion requirements are not met in window.

### What is cancelled explicitly
- User/system/staff cancellation event from allowed states.
- Website cancellation outcome from payment provider.
- Transfer timeout outcome (hold expired before completion).

### Inventory reopen policy (MVP)
- Reopen reserved inventory for any transition to `cancelled`.
- Reopen on failed website payment only if inventory was actually locked for that attempt.
- Keep inventory closed only for `confirmed` reservations.

### `expired` status note
- `expired` remains a canonical type for future policy extensions.
- MVP transition policy should continue using `cancelled` for transfer hold timeout outcomes, consistent with current approved transitions.

## 7) Idempotency and Submission Safety

### Actions requiring idempotency keys
- create branch request
- website checkout initiation
- website outcome submission
- transfer proof submission
- transfer verification
- POS coordination submission
- POS payment confirmation
- cancellation

### High-risk duplicate actions
- Provider callback retries (website outcomes).
- User double-submit of transfer proof / POS request.
- Staff double-click confirmation actions.
- Retry storms from flaky networks.

### Required behavior
- Same key + same payload => return same committed result.
- Same key + different payload => reject as conflict.
- Store action fingerprint + resulting transition.

## 8) Staff Workflow Requirements

### Transfer operations
- View `awaiting_transfer_verification` queue.
- Open proof details and history.
- Confirm or reject verification.
- See hold remaining time and expiry status.

### POS operations
- View `pending_pos_coordination` queue.
- Track contact attempts and notes.
- Mark POS payment completed.

### Shared staff controls
- Cancel reservation with reason.
- View reservation event timeline (actor, event, timestamp, metadata).
- Confirm actions only when transition guards pass.

## 9) Suggested Implementation Order

### Milestone 0: Finalize domain contract (already in progress)
- Validate status/event/checkpoint enums against docs and `src/types/booking.ts`.
- Freeze transition rules in `booking-state-machine.ts`.

### Milestone 1: Database schema + repositories
- Tables: drafts/reservations, events, idempotency keys, transfer hold metadata.
- Add unique indexes for token and idempotency scopes.
- Add repository interfaces matching domain types.

### Milestone 2: Draft APIs/actions
- Implement `createDraft`, `updateDraft`, `getDraftByToken`.
- Include pricing recomputation and validation.

### Milestone 3: Availability service integration
- Wire checkpoint-aware availability adapter.
- Persist checkpoint outcomes for audit/debug.

### Milestone 4: Branch request creation
- Implement `createBranchRequest` for website/transfer/POS.
- Ensure transfer hold timestamps are persisted.

### Milestone 5: Website payment path
- Implement checkout initiation + callback/outcome handling.
- Enforce `pending_online_payment` transition mapping.

### Milestone 6: Offline payment paths
- Transfer proof submission and staff verification path.
- POS coordination submission and staff completion path.

### Milestone 7: Expiry job + cancellation effects
- Scheduled hold-expiry worker for transfer windows.
- Inventory reopen on cancellation transitions.

### Milestone 8: Staff tooling (MVP)
- Minimal internal endpoints/UI for transfer verification and POS completion.
- Action audit trail visibility.

### Milestone 9: Hardening + observability
- Idempotency conflict tests.
- Transition guard integration tests.
- Metrics/logging for blocked transitions, expiry counts, callback retries.

## Risks and Dependencies

### Key dependencies
- Payment provider contract (outcome states + webhook guarantees).
- Inventory/availability service quality and latency.
- Staff operations channel/process for transfer and POS follow-up.

### Primary risks
- Mismatched provider outcome mapping causing invalid status transitions.
- Hold timer drift if worker schedule is delayed or timezone handling is inconsistent.
- Duplicate submissions without strict idempotency enforcement.
- Frontend showing stale branch labels if not derived from canonical status on resume.

### Mitigations
- Keep all transitions event-driven through domain helpers only.
- Use server-side time for hold checks; never trust client timestamps.
- Require idempotency keys on all mutating endpoints.
- Return canonical status + branch metadata on every response.

## Definition of MVP Done
- Drafts can be created, updated, resumed by token.
- All three payment branches execute with allowed transition rules.
- Transfer hold auto-cancellation after 1 hour is operational.
- Availability gates are enforced at every required checkpoint.
- Idempotency is enforced on high-risk mutating actions.
- Staff can complete transfer/POS confirmation actions safely.
- No transition path contradicts `docs/booking-state-machine.md`.
