# Backend Architecture Direction (Booking)

## Scope
This document defines the backend-ready architecture foundation for the booking domain.
It intentionally excludes database/framework wiring (no Prisma, no route handlers yet).

## Recommended Stack Direction
- Runtime: Node.js (LTS) with TypeScript strict mode.
- API layer: Next.js Route Handlers or a dedicated service layer, but keep domain logic framework-agnostic in `src/lib/`.
- Persistence direction (future): relational DB (PostgreSQL recommended) for reservation consistency and staff workflows.
- Async workflows (future): background job worker for hold expiry checks, verification reminders, and reconciliation.
- Observability direction: structured logs + request correlation + metrics around transition outcomes.

## Reservation Model Outline
Use a two-layer model:
- UI flow state: client-only view progression.
- Reservation status: canonical backend truth.

Core reservation aggregate (future DB projection):
- Identity: `id`, `token`.
- Canonical status: one of
  - `draft`
  - `pending_online_payment`
  - `pending_transfer_submission`
  - `awaiting_transfer_verification`
  - `pending_pos_coordination`
  - `confirmed`
  - `expired`
  - `cancelled`
  - `failed_payment`
- Shared booking data: stay details, guest details, selected payment method.
- Pricing snapshot: nightly rate, nights, extras subtotal (flat-fee extras only), estimated total.
- Availability snapshot(s): checkpoint, decision, version/timestamp.
- Branch fields:
  - website: portal attempt/outcome refs
  - transfer: hold window start/end, proof reference, verification timestamps
  - pos: coordination request timestamps, payment completion timestamp

## Core Backend Actions
1. `saveDraft`
- Save partial/complete booking draft details.
- No canonical pending status change unless branch request is created.

2. `checkAvailability`
- Checkpoint-aware availability service.
- Required checkpoints:
  - stay details entry
  - pre-hold/request
  - pre-online-payment-handoff
  - pre-transfer-confirmation
  - pre-pos-confirmation

3. `createBranchRequest`
- Requires `pre_hold_request` availability pass.
- Sets pending state based on payment method:
  - website -> `pending_online_payment`
  - transfer -> `pending_transfer_submission`
  - pos -> `pending_pos_coordination`

4. `handleWebsitePaymentOutcome`
- `success` -> `confirmed`
- `failed` -> `failed_payment`
- `cancelled` -> `cancelled`

5. `submitTransferProof`
- Valid only in active transfer hold window.
- `pending_transfer_submission` -> `awaiting_transfer_verification`

6. `verifyTransfer`
- Requires staff verification + hold window still active + `pre_transfer_confirmation` availability pass.
- `awaiting_transfer_verification` -> `confirmed`

7. `submitPosRequest`
- Keeps canonical status `pending_pos_coordination`.

8. `confirmPosPayment`
- Requires `pre_pos_confirmation` availability pass.
- `pending_pos_coordination` -> `confirmed`

9. `cancelReservation`
- Allowed from draft/pending/failed states according to state machine.
- Canonical target: `cancelled`.

10. `switchPaymentMethodWithBranchReset`
- Preserve shared data.
- Discard branch-specific transient state.
- Rebuild downstream branch path.
- Explicitly supported in approved scope for failed-payment recovery.

## Hold / Expiry Strategy
- Transfer hold duration: exactly 1 hour max from hold creation.
- Moving to `awaiting_transfer_verification` does not reset hold timer.
- If required completion is not achieved inside the same hold window, canonical outcome is `cancelled`.
- `expired` remains canonical but transition policy into `expired` is outside approved scope; keep status available for future policy updates.

Implementation direction (future):
- Persist hold start/end timestamps.
- Enforce hold checks server-side on every transfer-related mutation.
- Optional worker to proactively mark elapsed holds and notify staff/UI.

## Resumability Expectations
- Support resuming by booking token + server lookup.
- On resume, server must return canonical status + branch context + remaining hold time (if transfer branch).
- Client rehydrates UI flow from canonical status and selected payment method.
- UI must never claim confirmed unless status is `confirmed`.

## Staff Workflow Needs
- Transfer branch:
  - view pending proofs
  - verify/reject proofs
  - see remaining hold time and expiry state
- POS branch:
  - view pending coordination requests
  - mark payment complete
- Shared:
  - timeline of status transitions/events
  - ability to cancel with reason
  - audit metadata: actor/time/reason

## Idempotency Expectations
All mutating backend actions should accept an idempotency key.

Rules:
- Same key + same payload: return same committed result.
- Same key + different payload: reject as conflict.
- Store key with action fingerprint and resulting reservation transition.
- Protects against duplicate submits and retry storms.

Recommended idempotent actions:
- create branch request
- website outcome submission
- transfer proof submission
- transfer verification
- POS request submission
- POS payment confirmation
- cancellation

## Domain-First Implementation Notes
- Keep transition guards in domain layer (`booking-state-machine.ts`), not controller code.
- Keep pricing deterministic and side-effect free (`booking-pricing.ts`).
- Keep availability checkpoint wrappers explicit (`booking-availability.ts`).
- Keep validation pure and typed (`booking-validation.ts`).
- Keep branch step/label behavior config-driven (`booking-branch-config.ts`).
