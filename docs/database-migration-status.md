# Database Migration Status

This document is the honest temporary-state map for the Supabase Postgres refactor. The project is more coherent than it was before, but it is not fully migrated end to end. Prisma and Payload are aligned to Supabase Postgres in the main path, while a separate legacy reservation/inventory file-db layer still remains in the repo and is pending future migration.

## Current database posture

### Prisma now uses Supabase Postgres

- Prisma is Postgres-only in `prisma/schema.prisma`.
- Prisma uses `DATABASE_URL` as the canonical server-side connection string.
- Active Prisma bootstrap and validation live in `src/server/db/prisma-config.ts` and `src/server/db/prisma.ts`.

### Payload now uses Supabase Postgres in the normal path

- Payload CMS now defaults to the same `DATABASE_URL` as Prisma.
- `PAYLOAD_DATABASE_URL` is now only an explicit Payload override.
- In the normal local and production setup, leave `PAYLOAD_DATABASE_URL` blank so Payload and Prisma share the same Supabase Postgres database.
- The only remaining SQLite path for Payload is an explicit non-production `PAYLOAD_DATABASE_URL="file:./.data/payload.db"` override for a local CMS-only sandbox.
- That Payload-only SQLite sandbox is not the same thing as the legacy reservation/inventory file-db layer.

## Already migrated to Supabase Postgres

The following areas are already aligned to Prisma + Supabase Postgres in the active runtime path:

- Prisma schema and shared database initialization in `prisma/schema.prisma`, `src/server/db/prisma-config.ts`, and `src/server/db/prisma.ts`
- Payload CMS production/runtime configuration in `src/cms/payload.config.ts` and `src/cms/payload-database-config.ts`
- Booking drafts, reservation lifecycle, availability checks, website payments, offline payments, and staff operations under `src/server/booking/*`
- Guest reservation compatibility routes under `src/app/(site)/api/reservations/*`, via `src/server/booking/legacy-guest-reservation-service.ts`
- Inventory, readiness, and the admin inventory overview under `src/server/inventory/*`
- Notification persistence and delivery workflows under `src/server/booking/*` and `src/server/notifications/*`
- Auth runtime, session management, and the bootstrap CLI under `src/server/auth/*`
- Transfer-hold expiry under `src/server/jobs/expire-transfer-holds.ts`
- Tour scheduling runtime under `src/server/tour/*`
- Blog/CMS public content runtime under `src/server/cms/*`

## Still on legacy file-db services

These modules still use `.data/booking-mvp-db.json` through `src/server/db/file-database.ts`. They are intentionally isolated from the Prisma/Payload/Supabase runtime path and are pending future migration or removal.

### Legacy reservation and payment paths

- Legacy reservation/payment/availability service layer in `src/server/services/*`
- Legacy booking repositories in `src/server/booking/file-*.ts`
- The `FileWebsitePaymentIdempotencyGateway` implementation in `src/server/booking/idempotency-service.ts`

### Legacy inventory paths

- Legacy inventory repository logic in `src/server/inventory/file-inventory-operations-repository.ts`

### Other remaining file-db leftovers

- Legacy tour repository logic in `src/server/tour/file-tour-slot-repository.ts`
- Historical file-backed auth repository in `src/server/auth/file-auth-repository.ts`
- The shared JSON file-db substrate in `src/server/db/file-database.ts`

## Important boundary notes

- `src/server/booking/legacy-guest-reservation-service.ts` is a Prisma-backed compatibility adapter despite its name. It preserves older route contracts while keeping persistence on Supabase Postgres.
- `src/server/booking/idempotency-service.ts` is mixed on purpose right now: the shared runtime contract is still used by Prisma-backed services, but the `FileWebsitePaymentIdempotencyGateway` implementation remains legacy and file-backed.
- New runtime routes, jobs, CLIs, or service factories should not depend on `src/server/services/*`, `src/server/booking/file-*.ts`, or `src/server/inventory/file-inventory-operations-repository.ts`.
- “Prisma fixed” and “Payload fixed” do not mean the entire application is fully migrated. The remaining legacy reservation and inventory file-db services are still pending future migration.

## Next migration phase

1. Replace or delete the `src/server/services/*` reservation/payment/availability layer once every remaining caller is confirmed on Prisma-backed booking services.
2. Remove the `src/server/booking/file-*.ts` repositories after any local tooling or comparison workflows that still depend on them have been migrated or retired.
3. Remove `src/server/inventory/file-inventory-operations-repository.ts` after any remaining historical or tooling workflows are rehomed onto Prisma inventory repositories.
4. Decide whether `src/server/tour/file-tour-slot-repository.ts` should be migrated to Prisma or deleted along with the rest of the file-db cleanup.
5. After the legacy file-db modules are gone, remove `src/server/db/file-database.ts` and the `.data/booking-mvp-db.json` path from the repo's operational story.
