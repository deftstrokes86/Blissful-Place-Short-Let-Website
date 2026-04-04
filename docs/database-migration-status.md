# Database Migration Status

This document is the honest temporary-state map for the Supabase Postgres refactor. The project is moving toward one primary database backend, but some legacy file-db modules still remain in the repo and should not be mistaken for part of the cleaned Prisma runtime path.

## Migrated to Supabase Postgres

The following areas are already aligned to Prisma + Supabase Postgres in the active runtime path:

- Prisma schema and shared database initialization in `prisma/schema.prisma`, `src/server/db/prisma-config.ts`, and `src/server/db/prisma.ts`
- Booking drafts, reservation lifecycle, availability checks, website payments, offline payments, and staff operations under `src/server/booking/*`
- Guest reservation compatibility routes under `src/app/(site)/api/reservations/*`, via `src/server/booking/legacy-guest-reservation-service.ts`
- Inventory, readiness, and the admin inventory overview under `src/server/inventory/*`
- Notification persistence and delivery workflows under `src/server/booking/*` and `src/server/notifications/*`
- Auth runtime, session management, and the bootstrap CLI under `src/server/auth/*`
- Transfer-hold expiry under `src/server/jobs/expire-transfer-holds.ts`
- Tour scheduling runtime under `src/server/tour/*`
- Blog/CMS production runtime under `src/server/cms/*` and `src/cms/payload.config.ts`

## Still on legacy file-db services

These modules still use `.data/booking-mvp-db.json` through `src/server/db/file-database.ts` and are not yet migrated. They are intentionally isolated from the cleaned Prisma/Supabase runtime path.

- Legacy reservation/payment/availability service layer in `src/server/services/*`
- Legacy booking repositories in `src/server/booking/file-*.ts`
- The `FileWebsitePaymentIdempotencyGateway` implementation in `src/server/booking/idempotency-service.ts`
- Legacy inventory repository logic in `src/server/inventory/file-inventory-operations-repository.ts`
- Legacy tour repository logic in `src/server/tour/file-tour-slot-repository.ts`
- Historical file-backed auth repository in `src/server/auth/file-auth-repository.ts`
- The shared JSON file-db substrate in `src/server/db/file-database.ts`

## Important boundary notes

- `src/server/booking/legacy-guest-reservation-service.ts` is a Prisma-backed compatibility adapter despite its name. It preserves old route contracts while keeping persistence on Supabase Postgres.
- `src/server/booking/idempotency-service.ts` is mixed on purpose right now: the runtime contract is still shared there, but the `FileWebsitePaymentIdempotencyGateway` implementation remains legacy and file-backed.
- The local SQLite fallback in `src/cms/payload.config.ts` is a separate Payload development convenience. It is not the same thing as the legacy reservation/inventory file-db path.

## Next migration phase

1. Replace or delete the `src/server/services/*` reservation/payment/availability layer once every remaining caller is confirmed on Prisma-backed booking services.
2. Remove the `src/server/booking/file-*.ts` repositories after any local tooling or comparison workflows that still depend on them have been migrated or retired.
3. Remove `src/server/inventory/file-inventory-operations-repository.ts` after any remaining historical or tooling workflows are rehomed onto Prisma inventory repositories.
4. Decide whether `src/server/tour/file-tour-slot-repository.ts` should be migrated to Prisma or deleted along with the rest of the file-db cleanup.
5. After the legacy file-db modules are gone, remove `src/server/db/file-database.ts` and the `.data/booking-mvp-db.json` path from the repo's operational story.
