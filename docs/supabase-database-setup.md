# Supabase Database Setup For Hostinger Production

This app expects Supabase Postgres to be the production database, with Prisma using `DATABASE_URL` as the canonical server-side connection string.

## Recommended connection string for this repo

For the current Hostinger deployment, use the Supabase **Supavisor session pooler** connection string on port `5432` unless you have already verified that the direct database host works reliably from your Hostinger environment.

Recommended default runtime shape:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"
```

Direct connection is also acceptable when confirmed:

```env
DATABASE_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
```

Avoid making the transaction pooler on port `6543` your default runtime connection here. If you intentionally use it, append `pgbouncer=true` and keep a separate direct or session connection available for Prisma CLI workflows.

## How to get the Supabase connection string

1. Open your Supabase project.
2. Click **Connect**.
3. Copy either:
   - the **Session pooler** connection string on port `5432` for the default Hostinger-safe setup, or
   - the **Direct connection** string on port `5432` if you have already confirmed direct connectivity.
4. Replace the password placeholder with your actual database password if Supabase shows a templated URI.

## Required production env vars

Minimum database-critical values:

```env
NODE_ENV="production"
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"
PAYLOAD_SECRET="replace-with-a-long-random-secret"
PAYLOAD_DATABASE_URL=""
PAYLOAD_ALLOW_PRODUCTION_SQLITE="false"
PAYLOAD_AUTO_PUSH_SCHEMA="false"
SITE_URL="https://your-production-domain.example"
```

If blog media is also stored in Supabase Storage in production, set these too:

```env
PAYLOAD_MEDIA_SUPABASE_BUCKET="blog-media"
PAYLOAD_MEDIA_SUPABASE_REGION="your-storage-region"
PAYLOAD_MEDIA_SUPABASE_PROJECT_REF="your-project-ref"
PAYLOAD_MEDIA_SUPABASE_ENDPOINT=""
PAYLOAD_MEDIA_SUPABASE_ACCESS_KEY_ID="replace-with-supabase-storage-access-key"
PAYLOAD_MEDIA_SUPABASE_SECRET_ACCESS_KEY="replace-with-supabase-storage-secret-key"
PAYLOAD_MEDIA_SUPABASE_FORCE_PATH_STYLE="true"
PAYLOAD_ALLOW_PRODUCTION_LOCAL_MEDIA="false"
```

Notes:

- Leave `PAYLOAD_DATABASE_URL` blank in the normal setup so Payload reuses `DATABASE_URL`.
- `SHADOW_DATABASE_URL` is not required for normal production runtime.
- Never expose `DATABASE_URL` or storage secrets through `NEXT_PUBLIC_*` variables.

## Hostinger deployment steps

1. Open your Hostinger Node.js application dashboard.
2. Add or update the environment variables above.
3. Save the environment variable changes.
4. Use **Settings and redeploy** so the running app is rebuilt and restarted with the new env values.
5. After the new env is active, run the database migrations against production.

Build/start commands for this repo:

```bash
npm run build
npm run start
```

## Prisma migration workflow in production

Run Prisma schema migrations against the production `DATABASE_URL`:

```bash
npm run prisma:migrate:deploy
```

If you need to confirm migration state first:

```bash
npx prisma migrate status
```

If the generated Prisma client is stale in the deployment environment, regenerate it:

```bash
npm run prisma:generate
```

## Payload CMS migration workflow in production

Payload CMS has its own migration path and should be migrated after the production database env vars are in place:

```bash
npx payload migrate
```

That is the step that creates or updates the CMS schema and applies the blog-content import migrations already checked into this repo.

## What to do after env changes

Changing `DATABASE_URL`, `PAYLOAD_DATABASE_URL`, `PAYLOAD_SECRET`, or any Supabase media env var is not a hot change for the running Hostinger app. After updating them:

1. Save the env changes in Hostinger.
2. Use **Settings and redeploy**.
3. Re-run `npm run prisma:migrate:deploy` if the release includes Prisma schema changes.
4. Re-run `npx payload migrate` if the release includes Payload migrations.
5. Smoke-test `/`, `/availability`, `/blog`, `/cms`, and one authenticated admin path.

## Expected failure modes

The app now fails more explicitly when the DB config is wrong:

- Missing `DATABASE_URL`: startup tells you to set it in Hostinger and redeploy.
- Wrong protocol or malformed URI: startup tells you the app needs a valid `postgres://` or `postgresql://` Supabase connection string.
- Supabase transaction pooler on `6543` without `pgbouncer=true`: startup explains the mismatch and points you back to the preferred Hostinger setup.
- Missing production Payload DB config: Payload now throws a direct production Postgres configuration error instead of silently looking like a SQLite fallback problem.

## Quick production checklist

- `DATABASE_URL` is set to the Supabase session pooler on `5432` or a verified direct connection.
- `PAYLOAD_DATABASE_URL` is blank unless intentionally overridden.
- `PAYLOAD_ALLOW_PRODUCTION_SQLITE=false`.
- `npm run prisma:migrate:deploy` completed successfully.
- `npx payload migrate` completed successfully.
- Hostinger app was redeployed after env changes.
- `/blog` and `/cms` both load after deploy.
