# Payload Blog Database Path

This note exists to make the current blog-content dependency explicit.

## What `/blog` uses right now

- Public blog routes (`/blog` and `/blog/[slug]`) read published content through Payload CMS.
- Those reads go through `src/server/cms/blog-content-service.ts` and `src/cms/payload.ts`.
- The blog is not reading post content from Prisma models directly.

## Normal production database path

In the normal production setup:

- Prisma uses `DATABASE_URL`.
- Payload also uses `DATABASE_URL` by default.
- `PAYLOAD_DATABASE_URL` should stay blank.
- That means both Prisma and Payload point at the same Supabase Postgres database.

## When `PAYLOAD_DATABASE_URL` matters

`PAYLOAD_DATABASE_URL` is only for explicit exceptions:

- a deliberate Payload-only Postgres override, or
- an explicit non-production local CMS-only SQLite sandbox

If `PAYLOAD_DATABASE_URL` is set in a normal production deployment, it should usually be the same Supabase Postgres value as `DATABASE_URL`.

## SQLite status

Payload no longer has a silent production fallback to `file:./.data/payload.db`.

The only remaining SQLite path is explicit and local-only:

```env
PAYLOAD_DATABASE_URL="file:./.data/payload.db"
```

That override is only intended for a non-production CMS-only sandbox and is not the normal deployed blog database path.

## What happens on misconfiguration

If Payload cannot initialize because the database configuration is missing or invalid:

- the blog services should log a clearer Payload initialization failure
- `/blog` should fall back to an empty-content state instead of assuming content exists
- the fix is to verify `DATABASE_URL`, and `PAYLOAD_DATABASE_URL` only if you intentionally overrode Payload

## Operational checklist

1. Set `DATABASE_URL` to the server-side Supabase Postgres connection string.
2. Leave `PAYLOAD_DATABASE_URL` blank in the normal shared setup.
3. Redeploy after env changes.
4. Run `npx payload migrate` when Payload migrations are part of the release.
5. Smoke-test `/blog`, `/blog/[slug]`, and `/cms`.

## Related docs

- [production-env-setup.md](/e:/Blissful_Place%20-%20Copy/docs/production-env-setup.md)
- [database-architecture-status.md](/e:/Blissful_Place%20-%20Copy/docs/database-architecture-status.md)
- [database-migration-status.md](/e:/Blissful_Place%20-%20Copy/docs/database-migration-status.md)
