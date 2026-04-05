# Database Architecture Status

This document is the current-state map for the repo's database wiring. It is intentionally specific about what is already aligned to Supabase Postgres, what still uses local or file-based fallbacks, and what must change to make Prisma and Payload fully consistent.

## Current Prisma DB path

- Prisma is Postgres-only in `prisma/schema.prisma`.
- Prisma uses `DATABASE_URL` as its canonical server-side connection string.
- Runtime Prisma bootstrap happens through `src/server/db/prisma-config.ts` and `src/server/db/prisma.ts`.
- Prisma rejects SQLite or file-based URLs and expects a Prisma-ready Supabase Postgres URL.
- Local Prisma CLI workflows are designed to read `DATABASE_URL` from the repo root `.env`.

## Current Payload DB path

- Payload is configured in `src/cms/payload.config.ts`.
- Payload now defaults to the same `DATABASE_URL` as Prisma.
- `PAYLOAD_DATABASE_URL` remains available only as an explicit Payload override.
- The normal path is shared Supabase Postgres for both Prisma and Payload.
- Local SQLite is no longer an automatic Payload fallback.
- The only remaining SQLite path is an explicit non-production override: `PAYLOAD_DATABASE_URL="file:./.data/payload.db"`.

## Are Prisma and Payload already aligned?

Mostly yes.

- In the normal local and production path, they are aligned on the same Supabase Postgres connection through `DATABASE_URL`.
- `PAYLOAD_DATABASE_URL` exists only for exceptional cases:
  - a controlled Payload-only Postgres override, or
  - an explicit local CMS-only SQLite sandbox.
- Production should keep `PAYLOAD_DATABASE_URL` blank unless there is a documented reason to separate Payload.

## Env vars that matter right now

Normal shared Supabase Postgres setup:

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NODE_ENV`

Optional or conditional:

- `PAYLOAD_DATABASE_URL`
  - Leave blank in the normal shared setup.
  - Only set it when Payload must intentionally point at a different Postgres database, or when you deliberately want a local CMS-only SQLite sandbox.
- `PAYLOAD_AUTO_PUSH_SCHEMA`
  - Development convenience only.
  - Should stay `false` in normal production.
- `SHADOW_DATABASE_URL`
  - Prisma tooling only.
  - Not part of the normal runtime or `prisma:push` workflow.

## Remaining local or confusing assumptions

These are the main DB boundaries still present in the repo:

- `src/cms/payload-database-config.ts` still supports explicit local SQLite for Payload, but only through `PAYLOAD_DATABASE_URL="file:./.data/payload.db"` in non-production.
- `package.json` still depends on `@payloadcms/db-sqlite` because that explicit local CMS-only sandbox path still exists.
- `src/server/db/file-database.ts` still persists JSON data to `.data/booking-mvp-db.json` for legacy reservation, inventory, tour, and auth leftovers.
- Legacy file-db modules still exist and should not be mistaken for part of the active Prisma/Payload Supabase path.

## Legacy file-db services not yet migrated

These are still file-backed and should be treated as pending migration, not part of the cleaned Prisma/Supabase path:

- `src/server/services/*`
- `src/server/booking/file-*.ts`
- `src/server/booking/idempotency-service.ts`
  - The shared interface is still used, but `FileWebsitePaymentIdempotencyGateway` remains file-backed.
- `src/server/inventory/file-inventory-operations-repository.ts`
- `src/server/tour/file-tour-slot-repository.ts`
- `src/server/auth/file-auth-repository.ts`
- `src/server/db/file-database.ts`

The active runtime boundaries already document that new routes, jobs, CLIs, and factories should not depend on these modules.

## Intended target state

The intended end state is:

- Prisma uses Supabase Postgres through `DATABASE_URL`.
- Payload uses the same Supabase Postgres connection through `DATABASE_URL`.
- `PAYLOAD_DATABASE_URL` remains blank in normal deployments.
- Production does not depend on SQLite or `.data` JSON files.
- Remaining file-db reservation, inventory, tour, and auth leftovers are removed after their final migration phase.

## Exact next steps

1. Keep production on one shared Postgres connection.
   - Set `DATABASE_URL` in Hostinger.
   - Leave `PAYLOAD_DATABASE_URL` blank unless intentionally overriding Payload.
   - Redeploy after env changes.
2. Apply both schema/migration systems against the same Supabase database.
   - Run `npm run prisma:migrate:deploy`.
   - Run `npx payload migrate`.
3. Only use local Payload SQLite when it is an intentional CMS-only sandbox.
   - Set `PAYLOAD_DATABASE_URL="file:./.data/payload.db"` locally.
   - Do not point `DATABASE_URL` at SQLite.
   - Do not use that override in production.
4. Finish the legacy cleanup in a dedicated phase.
   - Remove the remaining `src/server/services/*` and `src/server/booking/file-*.ts` callers.
   - Migrate or retire the file-backed inventory, tour, auth, and idempotency implementations.
   - Remove `src/server/db/file-database.ts` and `.data/booking-mvp-db.json` from the operational story once nothing depends on them.

## Bottom line

- Prisma is already oriented around Supabase Postgres.
- Payload is now explicitly tied to the same Supabase Postgres path by default.
- The only remaining Payload SQLite path is a deliberate non-production override, not a hidden fallback.
- The repo is still not fully unified overall because legacy reservation, inventory, tour, and auth file-db modules still exist.
