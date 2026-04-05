# Blissful Place Residences

This is a Next.js application with Prisma-backed booking, availability, inventory, auth, tour, and blog/CMS flows.

## Local development

For local Prisma CLI work, keep `DATABASE_URL` in the repo root `.env` with a Prisma-ready Supabase connection string such as:

```env
DATABASE_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
```

Use `.env.local` for app/runtime-only overrides after that. This keeps raw Prisma CLI commands and the app aligned without shell-only env hacks.

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Prisma local workflow

Use this path for developer schema work against Supabase Postgres:

1. Put `DATABASE_URL` in the repo root `.env`.
2. Run `npm run prisma:validate` to confirm Prisma sees the right env and schema.
3. Run `npm run prisma:push` to sync schema changes to your development Supabase database.
4. Use `npm run prisma:generate` if the generated client needs to be refreshed.
5. Use `npm run prisma:migrate:deploy` only for deployment-ready migration application, not as the normal local schema-sync step.

Notes:

- `npm run prisma:db:push` is kept as a backwards-compatible alias, but `npm run prisma:push` is the preferred local command now.
- `SHADOW_DATABASE_URL` is not part of the normal `prisma:push` workflow.
- Optional: `npm run prisma:status` can be used to inspect Prisma migration state when the database connection itself is healthy.
- Windows PowerShell can block `npx prisma ...`; prefer the npm scripts in this repo or `npx.cmd prisma ...`.

## Production database setup

Supabase Postgres is the primary server-side database for this repo.

- `DATABASE_URL` is the canonical runtime database variable for Prisma.
- Payload CMS reuses `DATABASE_URL` by default when `PAYLOAD_DATABASE_URL` is left blank.
- If you intentionally set `PAYLOAD_DATABASE_URL` in normal production, it should usually be the same Supabase Postgres value as `DATABASE_URL`.
- For the current Hostinger deployment, the recommended default is the Supabase **Supavisor session pooler** on port `5432`.
- If you have already verified direct database connectivity from Hostinger, the direct `db.<project-ref>.supabase.co:5432` connection is also acceptable.
- Do not use the Supabase transaction pooler on `6543` here unless you intentionally append `pgbouncer=true` and keep a separate direct or session connection available for Prisma CLI workflows.

Start here for the production env checklist:
[docs/production-env-setup.md](/e:/Blissful_Place%20-%20Copy/docs/production-env-setup.md)

Use this for deeper Supabase connection and migration details:
[docs/supabase-database-setup.md](/e:/Blissful_Place%20-%20Copy/docs/supabase-database-setup.md)

Templates:
- [.env.example](/e:/Blissful_Place%20-%20Copy/.env.example)
- [.env.production.example](/e:/Blissful_Place%20-%20Copy/.env.production.example)

## Prisma and Payload migrations

Prisma production migrations:

```bash
npm run prisma:migrate:deploy
```

Payload CMS migrations:

```bash
npx payload migrate
```

If you change production environment variables on Hostinger, save them and then use **Settings and redeploy** before expecting the running app to see the new values.

## Useful scripts

- `npm run build`
- `npm run start`
- `npm run prisma:generate`
- `npm run prisma:validate`
- `npm run prisma:push`
- `npm run prisma:db:push`
- `npm run prisma:status`
- `npm run prisma:migrate:deploy`
- `npm run test:prisma-setup`
- `npm run test:runtime-db-consistency`
- `npm run test:cms`

## Next.js reference

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
