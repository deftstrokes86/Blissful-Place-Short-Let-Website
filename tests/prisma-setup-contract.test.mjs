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

  const envExample = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
  assert.match(envExample, /repo root/i);
  assert.match(envExample, /\.env\.local/i);
  assert.match(envExample, /db\.your-project-ref\.supabase\.co:5432\/postgres\?sslmode=require/i);
  assert.match(envExample, /not part of the normal `npm run prisma:push` workflow/i);

  const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");
  assert.match(readme, /npm run prisma:push/);
  assert.match(readme, /prisma:db:push/);
  assert.match(readme, /prisma:status/);
  assert.match(readme, /not part of the normal `prisma:push` workflow/i);

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
