This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Production CMS Environment

Set these production environment variables before deploying Payload-backed blog content:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?schema=public"
PAYLOAD_DATABASE_URL=""
PAYLOAD_ALLOW_PRODUCTION_SQLITE="false"
PAYLOAD_MEDIA_S3_BUCKET="your-media-bucket"
PAYLOAD_MEDIA_S3_REGION="eu-west-1"
PAYLOAD_MEDIA_S3_ENDPOINT=""
PAYLOAD_MEDIA_S3_ACCESS_KEY_ID="replace-with-access-key"
PAYLOAD_MEDIA_S3_SECRET_ACCESS_KEY="replace-with-secret-key"
PAYLOAD_MEDIA_S3_FORCE_PATH_STYLE="true"
PAYLOAD_ALLOW_PRODUCTION_LOCAL_MEDIA="false"
```

Notes:
- `DATABASE_URL` must point to a persistent Postgres database.
- Leave `PAYLOAD_DATABASE_URL` blank to let Payload reuse `DATABASE_URL`, or set it to the same Postgres connection string explicitly.
- Do not set `PAYLOAD_DATABASE_URL` to `file:./.data/payload.db` in production.
- `PAYLOAD_MEDIA_S3_ENDPOINT` can stay blank on AWS and will default to `https://s3.<region>.amazonaws.com`.
- For S3-compatible providers like Cloudflare R2, DigitalOcean Spaces, or MinIO, set `PAYLOAD_MEDIA_S3_ENDPOINT` explicitly.
- See `.env.production.example` for the full production-oriented template.

## CMS Migration

After production Postgres and media env vars are set, run Payload migrations to create the CMS schema and import the legacy blog snapshot:

```bash
npx payload migrate
```

Notes:
- The first migration bootstraps the Payload Postgres schema.
- The second migration imports the current legacy blog snapshot from `src/migrations/data/legacy-blog-content.json`.
- When S3 storage is configured, imported blog images are uploaded into object storage during the migration.
- The import intentionally creates a non-login legacy author account instead of copying old password hashes from SQLite.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
