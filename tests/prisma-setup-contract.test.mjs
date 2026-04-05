import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function run() {
  const schema = readFileSync(resolve(process.cwd(), "prisma", "schema.prisma"), "utf8");
  assert.match(schema, /provider\s*=\s*"postgresql"/);
  assert.match(schema, /url\s*=\s*env\("DATABASE_URL"\)/);
  assert.doesNotMatch(schema, /provider\s*=\s*"sqlite"/i);

  const prismaConfigSource = readFileSync(resolve(process.cwd(), "src", "server", "db", "prisma-config.ts"), "utf8");
  assert.match(prismaConfigSource, /DATABASE_URL is required/i);
  assert.match(prismaConfigSource, /Supabase Postgres/i);
  assert.match(prismaConfigSource, /postgres:\/\/ or postgresql:\/\//i);
  assert.match(prismaConfigSource, /Hostinger/i);
  assert.match(prismaConfigSource, /pgbouncer=true/i);
  assert.match(prismaConfigSource, /sslmode=require/i);
  assert.match(prismaConfigSource, /production-env-setup\.md/i);
  assert.doesNotMatch(prismaConfigSource, /createRequire\(/);

  const prismaClientSource = readFileSync(resolve(process.cwd(), "src", "server", "db", "prisma.ts"), "utf8");
  assert.match(prismaClientSource, /resolvePrismaClientOptions/);
  assert.match(prismaClientSource, /PrismaInitializationError/);
  assert.match(prismaClientSource, /Prisma client initialization failed before the app could access the database/i);
  assert.match(prismaClientSource, /Connection target:/i);
  assert.match(prismaClientSource, /new PrismaClient\(resolvePrismaClientOptions\(env\)\)|new PrismaCtor\(resolvePrismaClientOptions\(env\)\)/);

  const compatDbSource = readFileSync(resolve(process.cwd(), "src", "lib", "db.ts"), "utf8");
  assert.match(compatDbSource, /import \{ prisma \} from "\.\.\/server\/db\/prisma"/);
  assert.doesNotMatch(compatDbSource, /createRequire\(/);
  assert.doesNotMatch(compatDbSource, /new PrismaClient/);

  const payloadDbConfigSource = readFileSync(
    resolve(process.cwd(), "src", "cms", "payload-database-config.ts"),
    "utf8"
  );
  assert.match(payloadDbConfigSource, /PAYLOAD_DATABASE_URL/i);
  assert.match(payloadDbConfigSource, /DATABASE_URL/i);
  assert.match(payloadDbConfigSource, /production-env-setup\.md/i);
  assert.match(payloadDbConfigSource, /Payload uses PAYLOAD_DATABASE_URL when it is set; otherwise it falls back to DATABASE_URL/i);
  assert.match(payloadDbConfigSource, /Update .* to include \?sslmode=require/i);

  const envExample = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
  assert.match(envExample, /repo root/i);
  assert.match(envExample, /\.env\.local/i);
  assert.match(envExample, /Core app runtime/i);
  assert.match(envExample, /Prisma \/ Supabase Postgres/i);
  assert.match(envExample, /Payload CMS database/i);
  assert.match(envExample, /Payload media \/ Supabase Storage/i);
  assert.match(envExample, /db\.<project-ref>\.supabase\.co:5432\/postgres\?sslmode=require/i);
  assert.match(envExample, /Supabase Postgres URLs must keep \?sslmode=require/i);
  assert.match(envExample, /not part of the normal `npm run prisma:push` workflow/i);
  assert.match(envExample, /Public \/blog and \/blog\/\[slug\] reads depend on this same Payload database connection/i);
  assert.match(envExample, /Payload uses PAYLOAD_DATABASE_URL when it is set; otherwise it falls back to DATABASE_URL/i);
  assert.match(envExample, /leave PAYLOAD_DATABASE_URL blank so Payload uses the same DATABASE_URL as Prisma/i);
  assert.match(envExample, /should usually be identical to DATABASE_URL/i);
  assert.match(envExample, /production-env-setup\.md/i);

  const envProductionExample = readFileSync(resolve(process.cwd(), ".env.production.example"), "utf8");
  assert.match(envProductionExample, /Hostinger production environment template/i);
  assert.match(envProductionExample, /DATABASE_URL/i);
  assert.match(envProductionExample, /PAYLOAD_DATABASE_URL=""/i);
  assert.match(envProductionExample, /same Supabase Postgres value as DATABASE_URL/i);
  assert.match(envProductionExample, /PAYLOAD_MEDIA_SUPABASE_BUCKET/i);

  const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");
  assert.match(readme, /npm run prisma:push/);
  assert.match(readme, /prisma:db:push/);
  assert.match(readme, /prisma:status/);
  assert.match(readme, /production-env-setup\.md/i);
  assert.match(readme, /supabase-database-setup\.md/i);
  assert.match(readme, /not part of the normal `prisma:push` workflow/i);

  const productionEnvDoc = readFileSync(resolve(process.cwd(), "docs", "production-env-setup.md"), "utf8");
  assert.match(productionEnvDoc, /Hostinger/i);
  assert.match(productionEnvDoc, /DATABASE_URL/);
  assert.match(productionEnvDoc, /PAYLOAD_DATABASE_URL/);
  assert.match(productionEnvDoc, /PAYLOAD_SECRET/);
  assert.match(productionEnvDoc, /SITE_URL/);
  assert.match(productionEnvDoc, /PAYLOAD_MEDIA_SUPABASE_BUCKET/);
  assert.match(productionEnvDoc, /same Supabase Postgres value as `DATABASE_URL`|same Supabase Postgres value as DATABASE_URL/i);
  assert.match(productionEnvDoc, /Public `\/blog` and `\/blog\/\[slug\]` reads depend on this same Payload database path/i);
  assert.match(productionEnvDoc, /Settings and redeploy/i);
  assert.match(productionEnvDoc, /Supabase project dashboard/i);

  const payloadBlogDatabaseDoc = readFileSync(resolve(process.cwd(), "docs", "payload-blog-database-path.md"), "utf8");
  assert.match(payloadBlogDatabaseDoc, /What `\/blog` uses right now/i);
  assert.match(payloadBlogDatabaseDoc, /DATABASE_URL/);
  assert.match(payloadBlogDatabaseDoc, /PAYLOAD_DATABASE_URL/);

  const deployDoc = readFileSync(resolve(process.cwd(), "docs", "supabase-database-setup.md"), "utf8");
  assert.match(deployDoc, /Hostinger/i);
  assert.match(deployDoc, /DATABASE_URL/);
  assert.match(deployDoc, /prisma:migrate:deploy/);
  assert.match(deployDoc, /prisma:push/);
  assert.match(deployDoc, /prisma:status/);
  assert.match(deployDoc, /\.env\.local/i);
  assert.match(deployDoc, /repo root/i);
  assert.match(deployDoc, /not part of this workflow/i);
  assert.match(deployDoc, /Settings and redeploy/i);
  assert.match(deployDoc, /production-env-setup\.md/i);

  const prismaCliEnvScript = readFileSync(resolve(process.cwd(), "scripts", "prisma-cli-env.mjs"), "utf8");
  assert.match(prismaCliEnvScript, /\.env\.local/);
  assert.match(prismaCliEnvScript, /\.env/);
  assert.match(prismaCliEnvScript, /sslmode=require/i);

  const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));
  assert.equal(packageJson.scripts["prisma:generate"], "node scripts/prisma-cli.mjs generate");
  assert.equal(packageJson.scripts["prisma:validate"], "node scripts/prisma-cli.mjs validate --schema prisma/schema.prisma");
  assert.equal(packageJson.scripts["prisma:push"], "node scripts/prisma-cli.mjs db push");
  assert.equal(packageJson.scripts["prisma:db:push"], "npm run prisma:push");
  assert.equal(packageJson.scripts["prisma:status"], "node scripts/prisma-cli.mjs migrate status");
  assert.equal(packageJson.scripts["prisma:migrate:deploy"], "node scripts/prisma-cli.mjs migrate deploy");
  assert.match(packageJson.scripts["test:prisma-setup"], /prisma-bootstrap\.test\.js/);
  assert.equal(typeof packageJson.scripts["test:prisma-setup"], "string");

  console.log("prisma-setup-contract: ok");
}

run();


