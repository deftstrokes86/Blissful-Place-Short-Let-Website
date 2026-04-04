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
  assert.doesNotMatch(prismaConfigSource, /createRequire\(/);

  const prismaClientSource = readFileSync(resolve(process.cwd(), "src", "server", "db", "prisma.ts"), "utf8");
  assert.match(prismaClientSource, /resolvePrismaClientOptions/);
  assert.match(prismaClientSource, /new PrismaClient\(resolvePrismaClientOptions\(\)\)/);

  const compatDbSource = readFileSync(resolve(process.cwd(), "src", "lib", "db.ts"), "utf8");
  assert.match(compatDbSource, /import \{ prisma \} from "\.\.\/server\/db\/prisma"/);
  assert.doesNotMatch(compatDbSource, /createRequire\(/);
  assert.doesNotMatch(compatDbSource, /new PrismaClient/);

  const deployDoc = readFileSync(resolve(process.cwd(), "docs", "supabase-database-setup.md"), "utf8");
  assert.match(deployDoc, /Hostinger/i);
  assert.match(deployDoc, /DATABASE_URL/);
  assert.match(deployDoc, /prisma:migrate:deploy/);
  assert.match(deployDoc, /Settings and redeploy/i);

  const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));
  assert.equal(packageJson.scripts["prisma:generate"], "prisma generate");
  assert.equal(packageJson.scripts["prisma:migrate:deploy"], "prisma migrate deploy");
  assert.equal(typeof packageJson.scripts["test:prisma-setup"], "string");
  assert.equal("prisma:db:push" in packageJson.scripts, false);

  console.log("prisma-setup-contract: ok");
}

run();
