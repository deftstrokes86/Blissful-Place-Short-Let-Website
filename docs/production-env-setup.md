# Production Environment Setup

This is the quick-reference guide for configuring environment variables in Hostinger production.

## Default production contract

Normal production uses one shared Supabase Postgres connection for both Prisma and Payload CMS.

- Prisma always uses `DATABASE_URL`.
- Payload reuses `DATABASE_URL` when `PAYLOAD_DATABASE_URL` is blank.
- In the normal setup, leave `PAYLOAD_DATABASE_URL=""`.
- If you intentionally set `PAYLOAD_DATABASE_URL` in production, it should usually be the same Supabase Postgres value as `DATABASE_URL` unless you are doing a controlled split or migration.

## Required in Hostinger

### Core app runtime

- `NODE_ENV="production"`
  What it is for: enables production runtime behavior.
- `SITE_URL="https://your-production-domain.example"`
  What it is for: canonical server-side base URL for redirects, callbacks, and generated links.
- `PAYLOAD_SECRET="replace-with-a-long-random-secret"`
  What it is for: Payload CMS auth/session signing.

### Prisma / Supabase Postgres

- `DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"`
  What it is for: the main server-side database connection for Prisma and, by default, Payload CMS.
  Hostinger default: use the Supabase Supavisor session pooler on port `5432` unless you have already verified that the direct host works reliably from Hostinger.

Optional only for local Prisma migrate workflows:

- `SHADOW_DATABASE_URL=""`
  Leave blank in normal Hostinger production.

### Payload CMS database

Public `/blog` and `/blog/[slug]` reads depend on this same Payload database path.

- `PAYLOAD_DATABASE_URL=""`
  Normal production value: blank.
  Why: blank means Payload reuses `DATABASE_URL` and shares the same Supabase Postgres database as Prisma.
  If you do set it: use the same Supabase Postgres string as `DATABASE_URL` unless you intentionally want Payload isolated during a controlled migration.

- `PAYLOAD_AUTO_PUSH_SCHEMA="false"`
  What it is for: disables automatic schema push in normal production deploys.

### Payload media / Supabase Storage

Set these when blog-media uploads should persist in Supabase Storage:

- `PAYLOAD_MEDIA_SUPABASE_BUCKET`
  What it is for: the Supabase Storage bucket name, for example `blog-media`.
- `PAYLOAD_MEDIA_SUPABASE_REGION`
  What it is for: the storage region expected by the S3-compatible adapter.
- `PAYLOAD_MEDIA_SUPABASE_PROJECT_REF`
  What it is for: used to derive the Supabase Storage endpoint when `PAYLOAD_MEDIA_SUPABASE_ENDPOINT` is blank.
- `PAYLOAD_MEDIA_SUPABASE_ENDPOINT=""`
  Normal value: blank when `PAYLOAD_MEDIA_SUPABASE_PROJECT_REF` is set.
  Why: the app can derive `https://<project-ref>.storage.supabase.co/storage/v1/s3` automatically.
- `PAYLOAD_MEDIA_SUPABASE_ACCESS_KEY_ID`
  What it is for: Supabase Storage S3 access key.
- `PAYLOAD_MEDIA_SUPABASE_SECRET_ACCESS_KEY`
  What it is for: Supabase Storage S3 secret key.
- `PAYLOAD_MEDIA_SUPABASE_FORCE_PATH_STYLE="true"`
  What it is for: keeps the Payload S3 adapter compatible with Supabase Storage.
- `PAYLOAD_ALLOW_PRODUCTION_LOCAL_MEDIA="false"`
  Normal production value: false.
  Why: prevents production from silently falling back to ephemeral local-disk uploads.

### Feature-specific runtime secrets

These are not part of the DB/CMS contract, but they still belong in Hostinger when the related feature is enabled:

- `FLW_*` for Flutterwave payments
- `NOTIFICATION_*` for email/internal delivery configuration
- any future provider keys that are server-side only

Use [.env.example](/e:/Blissful_Place%20-%20Copy/.env.example) as the grouped template for those values.

## Where to get the Supabase database connection string

1. Open your Supabase project dashboard.
2. Click **Connect**.
3. Copy one of these:
   - the **Session pooler** connection string on port `5432` for the default Hostinger-safe production setup
   - the **Direct connection** string on port `5432` only if you have already verified that Hostinger can reach the direct database host reliably
4. Keep `?sslmode=require` on the final value.
5. Paste that value into `DATABASE_URL` in Hostinger.

## Where to get the Supabase Storage credentials

1. Open your Supabase project.
2. Go to **Storage**.
3. Confirm the bucket name, for example `blog-media`.
4. Open the Storage S3 compatibility or access-key settings.
5. Generate or copy the S3-compatible access key ID and secret access key.
6. Add those values to the `PAYLOAD_MEDIA_SUPABASE_*` variables in Hostinger.

## Hostinger steps

1. Open your Hostinger Node.js application dashboard.
2. Add or update the required variables from this document.
3. Save the changes.
4. Use **Settings and redeploy** so the running app picks up the new values.
5. After the redeploy, run any deployment migration commands required by the release.

## Strict npm peer dependency fallback

Normal deployment should keep the committed `package-lock.json` and use the platform's standard install behavior first.

Only if Hostinger or another strict npm environment still fails with a peer-dependency resolution error after the lockfile has been refreshed locally:

1. Retry the deployment with `npm install --legacy-peer-deps` as the install command, if your host lets you customize it.
2. If the host only supports env-based npm configuration, temporarily set `NPM_CONFIG_LEGACY_PEER_DEPS=true` for that deployment.
3. Redeploy, confirm the install completes, and then remove that fallback when the dependency graph no longer needs it.

This is intentionally a last resort. Do not treat `legacy-peer-deps` as the default production install mode for this repo.

## After env changes

Changing `DATABASE_URL`, `PAYLOAD_DATABASE_URL`, `PAYLOAD_SECRET`, or any `PAYLOAD_MEDIA_SUPABASE_*` value is not a hot change.

After updating them:

1. Save the env changes in Hostinger.
2. Use **Settings and redeploy**.
3. Re-run `npm run prisma:migrate:deploy` if Prisma schema changes are part of the release.
4. Re-run `npx payload migrate` if Payload migrations are part of the release.
5. Smoke-test `/`, `/blog`, and `/cms`.

## Related docs

- [supabase-database-setup.md](/e:/Blissful_Place%20-%20Copy/docs/supabase-database-setup.md) for deeper Supabase connection and migration workflow details
- [.env.production.example](/e:/Blissful_Place%20-%20Copy/.env.production.example) for the production-oriented env template
- [.env.example](/e:/Blissful_Place%20-%20Copy/.env.example) for the full grouped env template


