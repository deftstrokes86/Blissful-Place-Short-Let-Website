# Blissful Place Residences

This is a Next.js application with Prisma-backed booking, availability, inventory, auth, tour, and blog/CMS flows.

## Local development

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Production database setup

Supabase Postgres is the primary server-side database for this repo.

- `DATABASE_URL` is the canonical runtime database variable for Prisma.
- Payload CMS reuses `DATABASE_URL` by default when `PAYLOAD_DATABASE_URL` is left blank.
- For the current Hostinger deployment, the recommended default is the Supabase **Supavisor session pooler** on port `5432`.
- If you have already verified direct database connectivity from Hostinger, the direct `db.<project-ref>.supabase.co:5432` connection is also acceptable.
- Do not use the Supabase transaction pooler on `6543` here unless you intentionally append `pgbouncer=true` and keep a separate direct or session connection available for Prisma CLI workflows.

Start here for the full deployment checklist:
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
- `npm run prisma:migrate:deploy`
- `npm run test:prisma-setup`
- `npm run test:runtime-db-consistency`
- `npm run test:cms`

## Next.js reference

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
