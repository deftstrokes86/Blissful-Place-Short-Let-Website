# Manual Availability Blocks

## Purpose
Define manual calendar blocks for non-booking operational needs while preserving reservation-driven calendar truth.

## Scope
This document covers:
- creating manual blocks
- removing manual blocks
- recording reason/notes
- coexistence with reservation-driven blocks

Out of scope:
- Google Calendar/ICS sync
- advanced RBAC design
- unrelated back-office workflows

## Core Principles
1. Reservation-driven blocks and manual blocks must coexist safely.
2. Manual blocks are flat-specific.
3. Manual blocks must prevent booking while active.
4. Removing a manual block must reopen availability only if no other active overlapping block remains.
5. Manual-block actions must never delete or mutate reservation-source blocks.

## Manual Block Action Types

### 1) Create Maintenance Block
Use for maintenance downtime.

### 2) Create Owner Blackout Block
Use for owner-reserved dates.

### 3) Create Admin/Manual Block
Use for exceptional operational constraints.

### 4) Remove Manual Block
Releases a previously created manual block.

## Required Manual Block Data
At creation time capture:
- `flat_id`
- `start_date` (check-in inclusive)
- `end_date` (check-out exclusive)
- `source_type = manual`
- `source_id` (generated manual block id)
- `block_type` (MVP default: `hard_block`)
- `status = active`
- `reason_code` (for example `maintenance`, `owner_blackout`, `admin_manual`)
- optional `notes`
- optional `expires_at` only when intentionally time-bounded
- `created_at`, `updated_at`

Notes:
- In current booking scope, manual blocks should behave like hard unavailability.
- If temporary operational holds are later approved, they must be explicitly documented before staff tooling exposes them.

## Interaction With Reservation-Driven Calendar Sync

### Coexistence Rules
- Reservation sync manages `source_type = reservation` blocks.
- Staff manual controls manage `source_type = manual` blocks.
- These sources must not overwrite each other.

### Booking Availability Decision
A date range is unavailable if any overlapping active block exists for the selected flat:
- reservation hard block
- active transfer soft hold (where applicable)
- active manual block

### Removing Manual Blocks
- Releasing a manual block only changes that manual block.
- Availability reopens only when no other overlapping active block exists for that flat/date range.

## Date And Time Semantics
- Date boundaries: check-in inclusive, check-out exclusive.
- Timezone baseline: `Africa/Lagos`.
- Invalid windows (`end_date <= start_date`) must be rejected.
- Invalid `expires_at` timestamps must be rejected.

## Safety Rules
1. No manual-block action may bypass reservation-state safety.
2. No manual-block removal may delete reservation-source blocks.
3. No reservation confirmation logic may be inferred from manual-block changes.
4. Manual blocks do not grant authority to force `confirmed` status.

## Staff Tool UX Expectations
- Show clear block status (`active` or `released`).
- Show reason code and notes for operational clarity.
- Use concise labels:
  - `Create Maintenance Block`
  - `Create Owner Blackout`
  - `Create Admin Block`
  - `Release Block`
- Keep wording truthful and avoid implying reservation confirmation.

## Implementation Notes
- Manual block writes should be service-driven and idempotent.
- API handlers should remain thin and call operations services.
- Manual block queries should support flat filtering and optional inclusion of released blocks.
