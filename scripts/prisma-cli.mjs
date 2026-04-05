import { spawn } from "node:child_process";
import { createRequire } from "node:module";

import {
  assertPrismaCliDatabaseUrl,
  commandNeedsDatabaseUrl,
  resolvePrismaCliEnvironment,
} from "./prisma-cli-env.mjs";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/prisma-cli.mjs <prisma command>");
  process.exit(1);
}

const prismaEnv = resolvePrismaCliEnvironment();

if (commandNeedsDatabaseUrl(args) || prismaEnv.databaseUrl) {
  prismaEnv.env.DATABASE_URL = assertPrismaCliDatabaseUrl(prismaEnv.databaseUrl);
}

const require = createRequire(import.meta.url);
const prismaEntry = require.resolve("prisma/build/index.js");
const child = spawn(process.execPath, [prismaEntry, ...args], {
  cwd: process.cwd(),
  env: prismaEnv.env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
