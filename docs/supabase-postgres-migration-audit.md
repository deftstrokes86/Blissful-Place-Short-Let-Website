# Supabase Postgres Migration Audit

This document reflects the current end-state direction after the Supabase Postgres migration work, not the earlier mixed-runtime snapshot.

For the explicit migrated-vs-pending legacy boundary, see [Database Migration Status](./database-migration-status.md).

## Final posture

The project is now coherently oriented around Supabase Postgres as the main application database.

- Prisma uses `DATABASE_URL` as the canonical runtime database connection.
- Booking, availability, payments, inventory, readiness, notifications, auth, tour scheduling, and the guest reservation compatibility routes all run through Prisma-backed services in normal runtime paths.
- Payload CMS uses Postgres in production through `DATABASE_URL` by default, with `PAYLOAD_DATABASE_URL` kept only as an explicit override escape hatch.
- Supabase Storage remains the intended production media backend for blog uploads.

## What is aligned now

### Prisma schema and initialization

- [schema.prisma](/e:/Blissful_Place%20-%20Copy/prisma/schema.prisma) is Postgres-only and uses `env("DATABASE_URL")`.
- [prisma-config.ts](/e:/Blissful_Place%20-%20Copy/src/server/db/prisma-config.ts) validates that runtime DB config is a real Postgres connection string, rejects SQLite/file URLs, and gives Hostinger-specific guidance when `DATABASE_URL` is missing or malformed.
- [prisma.ts](/e:/Blissful_Place%20-%20Copy/src/server/db/prisma.ts) builds the shared Prisma client from that validated config.

### Runtime data access

These active runtime paths are aligned to Prisma + Supabase Postgres:

- Booking and reservation lifecycle services under [src/server/booking](/e:/Blissful_Place%20-%20Copy/src/server/booking)
- Guest reservation compatibility routes in [src/app/(site)/api/reservations](/e:/Blissful_Place%20-%20Copy/src/app/(site)/api/reservations)
- Availability checks in [route.ts](/e:/Blissful_Place%20-%20Copy/src/app/(site)/api/availability/check/route.ts)
- Website and offline payment flows under [src/app/(site)/api/payments](/e:/Blissful_Place%20-%20Copy/src/app/(site)/api/payments)
- Inventory/readiness/admin overview under [src/server/inventory](/e:/Blissful_Place%20-%20Copy/src/server/inventory)
- Auth runtime and bootstrap setup under [src/server/auth](/e:/Blissful_Place%20-%20Copy/src/server/auth)
- Transfer-hold expiry job under [expire-transfer-holds.ts](/e:/Blissful_Place%20-%20Copy/src/server/jobs/expire-transfer-holds.ts)
- Tour scheduling under [src/server/tour](/e:/Blissful_Place%20-%20Copy/src/server/tour)
- Blog/CMS public content and Payload production runtime under [src/server/cms](/e:/Blissful_Place%20-%20Copy/src/server/cms) and [payload.config.ts](/e:/Blissful_Place%20-%20Copy/src/cms/payload.config.ts)

## Remaining intentional exceptions

These do not change the main database direction, but they still exist in the repo:

- [payload.config.ts](/e:/Blissful_Place%20-%20Copy/src/cms/payload.config.ts) now defaults to the shared Supabase Postgres `DATABASE_URL`. The only remaining SQLite path is an explicit non-production `PAYLOAD_DATABASE_URL="file:./.data/payload.db"` override for a local CMS-only sandbox.
- Legacy file-backed modules still exist under `src/server/services/*`, `src/server/booking/file-*.ts`, `src/server/inventory/file-*.ts`, `src/server/tour/file-tour-slot-repository.ts`, and [file-database.ts](/e:/Blissful_Place%20-%20Copy/src/server/db/file-database.ts). They are now reference/migration leftovers, not the intended active runtime path.
- The old file-backed auth repository still exists in [file-auth-repository.ts](/e:/Blissful_Place%20-%20Copy/src/server/auth/file-auth-repository.ts), but bootstrap and normal auth runtime are now on Prisma.

## Environment variable contract

Keep these as the production-facing database contract:

- `DATABASE_URL`: canonical Supabase Postgres runtime connection
- `SHADOW_DATABASE_URL`: optional local Prisma migration tooling only
- `PAYLOAD_DATABASE_URL`: blank in normal deployments; only set for an intentional Payload-only override

- `PAYLOAD_AUTO_PUSH_SCHEMA=false` in normal production deployments

## Deployment workflow

The current env and deploy path is documented in [production-env-setup.md](/e:/Blissful_Place%20-%20Copy/docs/production-env-setup.md) and [supabase-database-setup.md](/e:/Blissful_Place%20-%20Copy/docs/supabase-database-setup.md).

Production expectations are now clear:

1. Set `DATABASE_URL` in Hostinger.
2. Save env changes.
3. Use **Settings and redeploy**.
4. Run `npm run prisma:migrate:deploy`.
5. Run `npx payload migrate` when Payload migrations are present.

## Residual cleanup opportunities

These are optional cleanup tasks, not blockers to calling Supabase Postgres the main database direction:

- Remove the remaining explicit local SQLite override path from Payload if you want Postgres-only behavior in every environment.
- Delete the remaining file-backed repository modules after you no longer need them for migration history or comparison.
- Remove legacy docs once the team no longer needs the migration trail.

## Audit conclusion

Supabase Postgres is now the main database direction for the project, Prisma is aligned correctly around `DATABASE_URL`, production deployment guidance is clearer, and the confusing runtime split that previously caused deployment risk has been materially reduced.





