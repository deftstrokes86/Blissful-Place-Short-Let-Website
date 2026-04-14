/**
 * TDD: CSS isolation between site routes and CMS routes.
 *
 * Root cause: @import "tailwindcss" in globals.css (loaded by root layout for ALL routes)
 * injects Tailwind's preflight CSS reset which destroys Payload admin's UI styles.
 *
 * Fix: Tailwind import must live in a site-only CSS file imported ONLY from (site)/layout.tsx,
 * not from the root layout.tsx.
 *
 * These tests verify the correct import structure is in place.
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const GLOBALS_CSS = path.join(ROOT, "src/app/globals.css");
const SITE_CSS = path.join(ROOT, "src/app/(site)/site.css");
const SITE_LAYOUT = path.join(ROOT, "src/app/(site)/layout.tsx");
const ROOT_LAYOUT = path.join(ROOT, "src/app/layout.tsx");

describe("CSS isolation: site vs CMS routes", () => {
  it("globals.css must NOT contain @import tailwindcss (it applies to CMS routes too)", () => {
    const css = fs.readFileSync(GLOBALS_CSS, "utf8");
    // Strip block comments before checking — the comment itself may mention @import
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(stripped).not.toMatch(/@import\s+["']tailwindcss["']/);
  });

  it("site.css must exist and contain the tailwindcss import", () => {
    expect(fs.existsSync(SITE_CSS)).toBe(true);
    const css = fs.readFileSync(SITE_CSS, "utf8");
    expect(css).toMatch(/@import\s+["']tailwindcss["']/);
  });

  it("site.css must contain the @theme block with brand color tokens", () => {
    const css = fs.readFileSync(SITE_CSS, "utf8");
    expect(css).toMatch(/@theme/);
    expect(css).toMatch(/--color-primary/);
  });

  it("(site)/layout.tsx must import site.css", () => {
    const layout = fs.readFileSync(SITE_LAYOUT, "utf8");
    expect(layout).toMatch(/import\s+["']\.\/site\.css["']/);
  });

  it("root layout.tsx must still import globals.css (for shared CSS vars)", () => {
    const layout = fs.readFileSync(ROOT_LAYOUT, "utf8");
    expect(layout).toMatch(/import\s+["']\.\/globals\.css["']/);
  });

  it("root layout.tsx must NOT import site.css (would pollute CMS routes)", () => {
    const layout = fs.readFileSync(ROOT_LAYOUT, "utf8");
    expect(layout).not.toMatch(/site\.css/);
  });

  it("root layout.tsx must NOT render <html> or <body> tags (CMS has its own document)", () => {
    const layout = fs.readFileSync(ROOT_LAYOUT, "utf8");
    // Strip single-line comments before checking to avoid false positives from code comments
    const stripped = layout.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(stripped).not.toMatch(/<html[\s>]/);
    expect(stripped).not.toMatch(/<body[\s>]/);
  });

  it("(site)/layout.tsx must render <html> and <body> tags (owns the document for site routes)", () => {
    const layout = fs.readFileSync(SITE_LAYOUT, "utf8");
    expect(layout).toMatch(/<html[\s>]/);
    expect(layout).toMatch(/<body[\s>]/);
  });
});
