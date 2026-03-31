#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const SCRIPT_VERSION = "1.0.0";

/**
 * @typedef {"flag"|"paragraph"} MarkdownMode
 */

/**
 * @typedef {{
 *   apply: boolean;
 *   rollbackFile: string | null;
 *   dbPath: string;
 *   reportPath: string | null;
 *   markdownMode: MarkdownMode;
 *   includeContent: boolean;
 * }} CliOptions
 */

/**
 * @typedef {{
 *   kind: "lexical_json" | "plain_markdown_string" | "plain_text_string" | "json_non_lexical" | "empty_string" | "null" | "non_string";
 *   parsed: Record<string, unknown> | null;
 * }} Classification
 */

function resolveDefaultDbPath() {
  const payloadDatabaseUrl = process.env.PAYLOAD_DATABASE_URL?.trim() || "file:./.data/payload.db";

  if (payloadDatabaseUrl.startsWith("file:")) {
    const relativePath = payloadDatabaseUrl.slice("file:".length);
    return path.resolve(process.cwd(), relativePath);
  }

  return path.resolve(process.cwd(), ".data/payload.db");
}

/**
 * @param {string[]} argv
 * @returns {CliOptions}
 */
function parseArgs(argv) {
  let apply = false;
  /** @type {string | null} */
  let rollbackFile = null;
  let dbPath = resolveDefaultDbPath();
  /** @type {string | null} */
  let reportPath = null;
  /** @type {MarkdownMode} */
  let markdownMode = "flag";
  let includeContent = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      apply = true;
      continue;
    }

    if (arg === "--include-content") {
      includeContent = true;
      continue;
    }

    if (arg === "--rollback") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --rollback");
      }
      rollbackFile = path.resolve(process.cwd(), value);
      index += 1;
      continue;
    }

    if (arg === "--db") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --db");
      }
      dbPath = path.resolve(process.cwd(), value);
      index += 1;
      continue;
    }

    if (arg === "--report") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --report");
      }
      reportPath = path.resolve(process.cwd(), value);
      index += 1;
      continue;
    }

    if (arg === "--markdown-mode") {
      const value = argv[index + 1];
      if (!value || (value !== "flag" && value !== "paragraph")) {
        throw new Error("Invalid value for --markdown-mode. Use 'flag' or 'paragraph'.");
      }
      markdownMode = value;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (rollbackFile && apply) {
    throw new Error("Use either --apply or --rollback, not both.");
  }

  return {
    apply,
    rollbackFile,
    dbPath,
    reportPath,
    markdownMode,
    includeContent,
  };
}

function printHelp() {
  console.log(`\nCMS Rich Text Body Migration (${SCRIPT_VERSION})\n`);
  console.log("Usage:");
  console.log("  Dry run (default): node scripts/cms-richtext-body-migration.cjs");
  console.log("  Apply migration:   node scripts/cms-richtext-body-migration.cjs --apply");
  console.log("  Rollback backup:   node scripts/cms-richtext-body-migration.cjs --rollback <backup.json>");
  console.log("\nOptions:");
  console.log("  --db <path>                    Override SQLite database path");
  console.log("  --report <path>                Write dry-run/apply report to custom path");
  console.log("  --markdown-mode <flag|paragraph>  How to handle markdown strings (default: flag)");
  console.log("  --include-content              Also scan columns named content/_content");
  console.log("  --help                         Show this help");
}

/**
 * @param {string} identifier
 */
function quoteIdentifier(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {unknown} parsed
 */
function isLexicalState(parsed) {
  if (!isRecord(parsed)) {
    return false;
  }

  const root = parsed.root;

  if (!isRecord(root)) {
    return false;
  }

  if (typeof root.type === "string" && root.type !== "root") {
    return false;
  }

  return Array.isArray(root.children);
}

/**
 * @param {unknown} value
 * @returns {Classification}
 */
function classifyValue(value) {
  if (value === null || value === undefined) {
    return { kind: "null", parsed: null };
  }

  if (typeof value !== "string") {
    return { kind: "non_string", parsed: null };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { kind: "empty_string", parsed: null };
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (isLexicalState(parsed)) {
      return { kind: "lexical_json", parsed };
    }

    return {
      kind: "json_non_lexical",
      parsed: isRecord(parsed) ? parsed : null,
    };
  } catch {
    const markdownPattern = /(^#{1,6}\s)|(^[-*+]\s)|(^\d+\.\s)|\*\*|__|\[(.*?)\]\((.*?)\)|(^>\s)/m;
    if (markdownPattern.test(trimmed)) {
      return { kind: "plain_markdown_string", parsed: null };
    }

    return { kind: "plain_text_string", parsed: null };
  }
}

/**
 * @param {string} rawText
 */
function buildLexicalParagraphState(rawText) {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  const paragraphChunks = normalized
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  const paragraphs = paragraphChunks.length > 0 ? paragraphChunks : [normalized];

  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: null,
      children: paragraphs.map((paragraph) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: null,
        textFormat: 0,
        textStyle: "",
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: paragraph,
          },
        ],
      })),
    },
  };
}

/**
 * @param {string} value
 */
function previewValue(value) {
  const sanitized = value.replace(/\s+/g, " ").trim();
  return sanitized.length <= 140 ? sanitized : `${sanitized.slice(0, 140)}...`;
}

/**
 * @param {{kind: Classification["kind"]}} classification
 * @param {MarkdownMode} markdownMode
 */
function planAction(classification, markdownMode) {
  if (classification.kind === "plain_text_string") {
    return "convert_to_lexical_paragraph";
  }

  if (classification.kind === "plain_markdown_string") {
    return markdownMode === "paragraph" ? "convert_to_lexical_paragraph" : "manual_review";
  }

  if (classification.kind === "json_non_lexical") {
    return "manual_review";
  }

  return "leave_unchanged";
}

/**
 * @param {DatabaseSync} db
 */
function listTables(db) {
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  return rows.map((row) => String(row.name));
}

/**
 * @param {DatabaseSync} db
 * @param {string} tableName
 */
function getTableColumns(db, tableName) {
  const pragma = db.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`).all();
  return pragma.map((row) => ({
    name: String(row.name),
    type: String(row.type ?? ""),
    pkIndex: Number(row.pk ?? 0),
  }));
}

/**
 * @param {{name: string; type: string; pkIndex: number}[]} columns
 * @param {CliOptions} options
 */
function getTargetColumns(columns, options) {
  return columns
    .filter((column) => {
      const lower = column.name.toLowerCase();
      const isBodyColumn = lower === "body" || lower.endsWith("_body");
      const isContentColumn = options.includeContent && (lower === "content" || lower.endsWith("_content"));
      const isText = column.type.toUpperCase().includes("TEXT") || column.type.length === 0;
      return isText && (isBodyColumn || isContentColumn);
    })
    .map((column) => column.name);
}

/**
 * @param {{name: string; type: string; pkIndex: number}[]} columns
 */
function getPrimaryKeyColumns(columns) {
  return columns
    .filter((column) => column.pkIndex > 0)
    .sort((left, right) => left.pkIndex - right.pkIndex)
    .map((column) => column.name);
}

/**
 * @param {DatabaseSync} db
 * @param {string} tableName
 * @param {string} columnName
 * @param {string[]} pkColumns
 */
function readColumnRows(db, tableName, columnName, pkColumns) {
  const pkProjection = pkColumns.length > 0
    ? pkColumns.map((column) => quoteIdentifier(column)).join(", ")
    : "rowid AS __rowid";

  const statement = db.prepare(
    `SELECT ${pkProjection}, ${quoteIdentifier(columnName)} AS __value FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(columnName)} IS NOT NULL`
  );

  return statement.all();
}

/**
 * @param {string[]} pkColumns
 * @param {Record<string, unknown>} row
 */
function extractRecordIdentity(pkColumns, row) {
  if (pkColumns.length > 0) {
    const key = {};
    for (const column of pkColumns) {
      key[column] = row[column];
    }
    return key;
  }

  return { __rowid: row.__rowid };
}

/**
 * @param {string[]} keyColumns
 */
function buildWhereClause(keyColumns) {
  if (keyColumns.length === 0) {
    return {
      whereSql: "rowid = ?",
      getParams: (key) => [key.__rowid],
    };
  }

  const whereSql = keyColumns.map((column) => `${quoteIdentifier(column)} = ?`).join(" AND ");

  return {
    whereSql,
    getParams: (key) => keyColumns.map((column) => key[column]),
  };
}

/**
 * @param {DatabaseSync} db
 * @param {{table: string; column: string; key: Record<string, unknown>; originalValue: string; action: string; classification: string; preview: string}} item
 */
function fetchRowSnapshot(db, item) {
  const keyColumns = Object.keys(item.key).filter((column) => column !== "__rowid");
  const where = buildWhereClause(keyColumns);
  const sql = `SELECT * FROM ${quoteIdentifier(item.table)} WHERE ${where.whereSql} LIMIT 1`;
  const row = db.prepare(sql).get(...where.getParams(item.key));
  return row ?? null;
}

/**
 * @param {CliOptions} options
 */
function runAudit(options) {
  const db = new DatabaseSync(options.dbPath, { readOnly: false });

  try {
    const tables = listTables(db);

    /** @type {Array<{
     * table: string;
     * column: string;
     * key: Record<string, unknown>;
     * classification: Classification["kind"];
     * action: string;
     * preview: string;
     * originalValue: string;
     * }>} */
    const findings = [];

    let scannedRowCount = 0;
    let scannedColumns = 0;

    for (const table of tables) {
      const columns = getTableColumns(db, table);
      const targetColumns = getTargetColumns(columns, options);

      if (targetColumns.length === 0) {
        continue;
      }

      const pkColumns = getPrimaryKeyColumns(columns);

      for (const column of targetColumns) {
        scannedColumns += 1;
        const rows = readColumnRows(db, table, column, pkColumns);

        for (const row of rows) {
          scannedRowCount += 1;
          const rawValue = row.__value;
          const classification = classifyValue(rawValue);

          if (classification.kind === "lexical_json" || classification.kind === "null" || classification.kind === "empty_string") {
            continue;
          }

          const action = planAction(classification, options.markdownMode);

          if (typeof rawValue !== "string") {
            continue;
          }

          findings.push({
            table,
            column,
            key: extractRecordIdentity(pkColumns, row),
            classification: classification.kind,
            action,
            preview: previewValue(rawValue),
            originalValue: rawValue,
          });
        }
      }
    }

    const summary = {
      totalAffected: findings.length,
      convertCandidates: findings.filter((entry) => entry.action === "convert_to_lexical_paragraph").length,
      manualReview: findings.filter((entry) => entry.action === "manual_review").length,
      byClassification: findings.reduce((acc, entry) => {
        acc[entry.classification] = (acc[entry.classification] || 0) + 1;
        return acc;
      }, /** @type {Record<string, number>} */ ({})),
    };

    const generatedAt = new Date().toISOString();
    const report = {
      scriptVersion: SCRIPT_VERSION,
      generatedAt,
      dbPath: options.dbPath,
      dryRun: !options.apply,
      markdownMode: options.markdownMode,
      includeContent: options.includeContent,
      scanned: {
        tableCount: tables.length,
        columnCount: scannedColumns,
        rowCount: scannedRowCount,
      },
      summary,
      affected: findings.map((entry) => ({
        table: entry.table,
        column: entry.column,
        key: entry.key,
        classification: entry.classification,
        action: entry.action,
        preview: entry.preview,
      })),
    };

    return {
      db,
      findings,
      report,
    };
  } catch (error) {
    db.close();
    throw error;
  }
}

/**
 * @param {string} filePath
 */
function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/**
 * @param {string} prefix
 */
function createTimestampedPath(prefix) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(process.cwd(), `.data/db-backups/${prefix}-${timestamp}.json`);
}

/**
 * @param {DatabaseSync} db
 * @param {Array<{table: string; column: string; key: Record<string, unknown>; classification: string; action: string; preview: string; originalValue: string}>} findings
 */
function applyMigration(db, findings) {
  const updates = findings.filter((entry) => entry.action === "convert_to_lexical_paragraph");

  if (updates.length === 0) {
    return {
      appliedCount: 0,
      backupEntries: [],
    };
  }

  /** @type {Array<Record<string, unknown>>} */
  const backupEntries = [];

  db.exec("BEGIN");

  try {
    for (const entry of updates) {
      const keyColumns = Object.keys(entry.key).filter((column) => column !== "__rowid");
      const where = buildWhereClause(keyColumns);

      const lexicalState = buildLexicalParagraphState(entry.originalValue);
      const lexicalJson = JSON.stringify(lexicalState);

      const beforeSnapshot = fetchRowSnapshot(db, entry);

      backupEntries.push({
        table: entry.table,
        column: entry.column,
        key: entry.key,
        classification: entry.classification,
        action: entry.action,
        beforeValue: entry.originalValue,
        beforeSnapshot,
      });

      const updateSql = `UPDATE ${quoteIdentifier(entry.table)} SET ${quoteIdentifier(entry.column)} = ? WHERE ${where.whereSql}`;
      const result = db.prepare(updateSql).run(lexicalJson, ...where.getParams(entry.key));

      if (Number(result.changes ?? 0) !== 1) {
        throw new Error(`Expected exactly one updated row for ${entry.table}.${entry.column} ${JSON.stringify(entry.key)}`);
      }
    }

    db.exec("COMMIT");

    return {
      appliedCount: updates.length,
      backupEntries,
    };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

/**
 * @param {string} backupFile
 * @param {string} dbPath
 */
function runRollback(backupFile, dbPath) {
  const raw = fs.readFileSync(backupFile, "utf8");
  const backup = JSON.parse(raw);

  if (!Array.isArray(backup.updatedEntries)) {
    throw new Error("Backup file is missing updatedEntries array.");
  }

  const db = new DatabaseSync(dbPath, { readOnly: false });

  try {
    db.exec("BEGIN");

    for (const entry of backup.updatedEntries) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const table = String(entry.table);
      const column = String(entry.column);
      const key = entry.key;

      if (!key || typeof key !== "object") {
        throw new Error(`Invalid rollback key for ${table}.${column}`);
      }

      const keyColumns = Object.keys(key).filter((name) => name !== "__rowid");
      const where = buildWhereClause(keyColumns);
      const sql = `UPDATE ${quoteIdentifier(table)} SET ${quoteIdentifier(column)} = ? WHERE ${where.whereSql}`;
      const result = db.prepare(sql).run(String(entry.beforeValue ?? ""), ...where.getParams(key));

      if (Number(result.changes ?? 0) !== 1) {
        throw new Error(`Rollback expected one row for ${table}.${column} ${JSON.stringify(key)}`);
      }
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }

  return {
    restoredCount: backup.updatedEntries.length,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(options.dbPath)) {
    throw new Error(`Database file not found: ${options.dbPath}`);
  }

  if (options.rollbackFile) {
    if (!fs.existsSync(options.rollbackFile)) {
      throw new Error(`Rollback file not found: ${options.rollbackFile}`);
    }

    const rollbackResult = runRollback(options.rollbackFile, options.dbPath);
    console.log(`[rollback] Restored ${rollbackResult.restoredCount} entries from ${options.rollbackFile}`);
    return;
  }

  const { db, findings, report } = runAudit(options);

  try {
    let reportPath = options.reportPath;
    if (!reportPath) {
      reportPath = createTimestampedPath(options.apply ? "cms-richtext-body-migration-apply-report" : "cms-richtext-body-migration-dry-run");
    }

    ensureDirectory(reportPath);

    if (!options.apply) {
      fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
      console.log("[dry-run] Scan complete.");
      console.log(`  Affected entries: ${report.summary.totalAffected}`);
      console.log(`  Convertible: ${report.summary.convertCandidates}`);
      console.log(`  Manual review: ${report.summary.manualReview}`);
      console.log(`  Report: ${reportPath}`);
      return;
    }

    const backupPath = createTimestampedPath("cms-richtext-body-migration-backup");
    ensureDirectory(backupPath);

    const applyResult = applyMigration(db, findings);

    const backupPayload = {
      scriptVersion: SCRIPT_VERSION,
      generatedAt: new Date().toISOString(),
      dbPath: options.dbPath,
      markdownMode: options.markdownMode,
      updatedEntries: applyResult.backupEntries,
      manualReviewEntries: findings
        .filter((entry) => entry.action === "manual_review")
        .map((entry) => ({
          table: entry.table,
          column: entry.column,
          key: entry.key,
          classification: entry.classification,
          preview: entry.preview,
          beforeValue: entry.originalValue,
        })),
    };

    fs.writeFileSync(backupPath, `${JSON.stringify(backupPayload, null, 2)}\n`, "utf8");

    const applyReport = {
      ...report,
      dryRun: false,
      appliedCount: applyResult.appliedCount,
      backupFile: backupPath,
    };

    fs.writeFileSync(reportPath, `${JSON.stringify(applyReport, null, 2)}\n`, "utf8");

    console.log("[apply] Migration complete.");
    console.log(`  Updated entries: ${applyResult.appliedCount}`);
    console.log(`  Backup: ${backupPath}`);
    console.log(`  Report: ${reportPath}`);
  } finally {
    db.close();
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[error] ${message}`);
  process.exit(1);
}
