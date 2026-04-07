import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ADMIN_SURFACE_ROOTS = [
  "src/app/(site)/admin",
  "src/app/(site)/staff",
  "src/components/admin",
];

const SOURCE_FILE_EXTENSIONS = new Set([".ts", ".tsx"]);
const CONTEXT_MARKERS = ["createContext(", "useContext("];

function read(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function collectSourceFiles(relativeDirectoryPath) {
  const absoluteDirectoryPath = resolve(process.cwd(), relativeDirectoryPath);
  const entries = readdirSync(absoluteDirectoryPath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const relativeEntryPath = `${relativeDirectoryPath}/${entry.name}`.replace(/\\/g, "/");

    if (entry.isDirectory()) {
      return collectSourceFiles(relativeEntryPath);
    }

    if (!entry.isFile()) {
      return [];
    }

    const extensionStart = entry.name.lastIndexOf(".");
    const extension = extensionStart >= 0 ? entry.name.slice(extensionStart) : "";

    return SOURCE_FILE_EXTENSIONS.has(extension) ? [relativeEntryPath] : [];
  });
}

function run() {
  const sourceFiles = ADMIN_SURFACE_ROOTS.flatMap((relativePath) => collectSourceFiles(relativePath));
  const contextConsumers = sourceFiles.filter((relativePath) => {
    const source = read(relativePath);
    return CONTEXT_MARKERS.some((marker) => source.includes(marker));
  });

  assert.deepEqual(
    contextConsumers,
    [],
    [
      "Admin and staff surfaces currently do not rely on custom React contexts.",
      "If you introduce one later, add a null-safe wrapper hook or guarded consumer path first,",
      "then update this test intentionally.",
      `Unexpected context usage: ${contextConsumers.join(", ")}`,
    ].join(" "),
  );

  console.log("admin-context-safety: ok");
}

run();
