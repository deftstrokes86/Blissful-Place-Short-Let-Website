import crypto from "node:crypto";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function resolveSqlitePath(databaseUrl) {
  if (typeof databaseUrl !== "string" || !databaseUrl.startsWith("file:")) {
    return null;
  }

  const filePath = databaseUrl.slice("file:".length);
  return path.resolve(process.cwd(), filePath);
}

function createPasswordSaltHash(password) {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 25000, 512, "sha256").toString("hex");

  return { salt, hash };
}

const payloadDatabaseUrl = process.env.PAYLOAD_DATABASE_URL?.trim() || "file:./.data/payload.db";
const sqlitePath = resolveSqlitePath(payloadDatabaseUrl);

if (!sqlitePath) {
  throw new Error("PAYLOAD_DATABASE_URL must use file: syntax for local sqlite e2e seeding.");
}

const email = (process.env.CMS_E2E_EMAIL || "cms.e2e+local@blissfulplaceresidences.com").trim().toLowerCase();
const password = process.env.CMS_E2E_PASSWORD || "CmsE2E!Pass123";
const name = process.env.CMS_E2E_NAME || "CMS E2E Admin";
const role = "admin";

if (password.length < 8) {
  throw new Error("CMS_E2E_PASSWORD must be at least 8 characters.");
}

const db = new DatabaseSync(sqlitePath);

try {
  const existing = db.prepare("SELECT id FROM cms_users WHERE email = ? LIMIT 1").get(email);
  const { salt, hash } = createPasswordSaltHash(password);

  if (existing && typeof existing.id === "number") {
    db.prepare(
      "UPDATE cms_users SET name = ?, role = ?, salt = ?, hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?"
    ).run(name, role, salt, hash, existing.id);
    console.log(`Updated CMS e2e user: ${email}`);
  } else {
    db.prepare("INSERT INTO cms_users (name, role, email, salt, hash) VALUES (?, ?, ?, ?, ?)").run(
      name,
      role,
      email,
      salt,
      hash
    );
    console.log(`Created CMS e2e user: ${email}`);
  }
} finally {
  db.close();
}
