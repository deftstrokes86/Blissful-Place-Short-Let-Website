# Notifications

## Purpose
This document defines the booking notifications architecture for the current MVP phase.
The goal is to close the communication loop between reservation-state changes and humans.

Notifications should:
- inform guests when booking state changes meaningfully
- inform staff when operational action is required
- remain truthful to canonical reservation state

## Scope
In scope for this phase:
- event-driven notification intents from backend domain/service boundaries
- guest notifications for meaningful booking-state updates
- staff notifications for operational queues and state changes
- delivery-attempt tracking with clear statuses

Out of scope for this phase:
- marketing automation
- notification preferences center
- external WhatsApp/SMS delivery
- full inbox or messaging product

## Source of Truth
Reservation status is canonical truth.
Notification logic must align with:
- `docs/booking-state-machine.md`
- `docs/booking-flow.md`
- `docs/payment-branch-rules.md`

Canonical reservation statuses:
- `draft`
- `pending_online_payment`
- `pending_transfer_submission`
- `awaiting_transfer_verification`
- `pending_pos_coordination`
- `confirmed`
- `expired`
- `cancelled`
- `failed_payment`

## Channel Strategy (This Phase)
Active channels now:
- `email`
- `internal/admin notification log`

Future-ready channels (not implemented now):
- WhatsApp
- SMS

Design rule:
- channel choice must be pluggable and independent from reservation transition logic

## Truth Rules (Non-Negotiable)
- Do not send any "booking confirmed" notification before reservation status is `confirmed`.
- Do not send "transfer confirmed" before staff verification transition is complete.
- Do not send "POS confirmed" before staff marks POS payment complete.
- Transfer pending and transfer confirmed are different notifications.
- POS request submitted and POS confirmed are different notifications.
- Notification wording must map to actual reservation state, not UI guesses.

## Architecture Direction
Use a three-step model:
1. `Domain event` (reservation transition or operational event)
2. `Notification intent` (audience, template key, payload, dedupe key)
3. `Delivery attempt` (per channel, tracked result)

### Trigger Placement
- Trigger notification intent at service boundaries where state transitions are committed.
- Keep route handlers thin.
- Do not scatter ad hoc `sendEmail(...)` calls across handlers/UI.

### Idempotency and Deduplication
- Notification intent creation should be idempotent for repeated delivery or repeated webhook/job calls.
- Use deterministic dedupe keys tied to reservation + transition context.
- Repeated processing must not create duplicate user-facing side effects.

## Delivery and Result Tracking
Track each notification attempt with status:
- `queued` (or pending)
- `sent`
- `failed`

Later-safe extension:
- retry policy for `failed` attempts
- backoff and retry caps per channel
- dead-letter handling for persistent failures

## Audience Model
Guest audience:
- receives booking-state communication and next steps

Staff audience:
- receives operational alerts requiring action
- receives key completion/cancellation visibility

## Interaction with Booking Branches
Website branch:
- pending online payment and final outcomes are distinct

Transfer branch:
- pending transfer submission, awaiting verification, confirmed, expired/cancelled are distinct communication moments

POS branch:
- request submitted and confirmed are distinct communication moments

## Safety Constraints
- Notifications do not change reservation state.
- Delivery failures do not auto-confirm or auto-cancel reservations.
- Reservation transition logic stays in domain services/state machine.

## Implementation Notes
- Prefer typed template keys over free-text event names.
- Keep payloads minimal, explicit, and safe for channel adapters.
- Build channel adapters behind interfaces so WhatsApp/SMS can be added later without rewriting domain triggers.
- Ensure timestamps are recorded consistently in `Africa/Lagos`-aware UI formatting, while storage remains ISO timestamps.
