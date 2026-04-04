# Runtime Data Backend Boundaries

This repo now treats Supabase Postgres, reached through Prisma and `DATABASE_URL`, as the primary runtime database for the application.

## Active runtime paths on Prisma + Supabase Postgres

- Booking drafts, reservation transitions, availability checks, website payments, offline payments, and staff operations run through the Prisma-backed factories under `src/server/booking/*`.
- Guest reservation compatibility routes at `src/app/(site)/api/reservations/draft/**`, `branch-request`, and `cancel` now delegate into `src/server/booking/legacy-guest-reservation-service.ts`, which uses Prisma-backed draft, reservation, availability, and idempotency services.
- Inventory and readiness runtime flows now read and write through Prisma-backed services. The admin inventory overview in `src/server/inventory/admin-inventory-service.ts` reads directly from Prisma so the operations dashboard no longer depends on `.data/booking-mvp-db.json`.
- Auth and internal user/session management use Prisma-backed auth repositories under `src/server/auth/*`, including the one-time bootstrap CLI in `src/server/auth/bootstrap-cli.ts`.
- Notification persistence uses Prisma-backed repositories under `src/server/booking/*` and `src/server/notifications/*`.
- Transfer-hold expiry uses the Prisma-backed reservation service path in `src/server/jobs/expire-transfer-holds.ts`.
- Public blog/content runtime reads use Payload against Postgres in production. `PAYLOAD_DATABASE_URL` remains only as an explicit Payload-only override; `DATABASE_URL` remains the canonical app database connection.
- Tour appointment runtime flows use the Prisma-backed repository wired by `src/server/tour/tour-slot-service-factory.ts`.

## Isolated legacy boundaries

The following legacy file-backed modules still exist for migration reference, backwards comparison, or local-only tooling, but they should not be imported by active app routes, jobs, CLIs, or shared runtime factories:

- `src/server/services/*`
- `src/server/auth/file-auth-repository.ts`
- `src/server/booking/file-*.ts`
- `src/server/inventory/file-*.ts`
- `src/server/tour/file-tour-slot-repository.ts`
- `src/server/db/file-database.ts`

If a new runtime route, job, CLI, or shared factory needs booking, availability, inventory, notification, auth, or tour data, it should depend on the Prisma-backed factories and repositories instead of these file-backed modules.

## Payload boundary

Payload production runtime should resolve to Supabase Postgres through `DATABASE_URL`, with `PAYLOAD_DATABASE_URL` used only when Payload must intentionally point at a different Postgres database. The remaining local SQLite bootstrap path in `src/cms/payload.config.ts` is a development-only exception and is not part of the intended deployed runtime data path.
