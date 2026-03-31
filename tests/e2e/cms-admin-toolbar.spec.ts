import { expect, type Locator, test, type Page } from "@playwright/test";

const cmsE2EEmail = process.env.CMS_E2E_EMAIL ?? "cms.e2e+local@blissfulplaceresidences.com";
const cmsE2EPassword = process.env.CMS_E2E_PASSWORD ?? "CmsE2E!Pass123";

async function isVisible(locator: Locator, timeout = 3_000): Promise<boolean> {
  try {
    await locator.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function loginIfNeeded(page: Page): Promise<void> {
  await page.goto("/cms", { waitUntil: "domcontentloaded" });

  const emailInput = page.locator('input[name="email"]').first();
  const passwordInput = page.locator('input[name="password"]').first();

  if (!(await isVisible(emailInput)) || !(await isVisible(passwordInput))) {
    return;
  }

  await emailInput.fill(cmsE2EEmail);
  await passwordInput.fill(cmsE2EPassword);

  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState("networkidle");

  const stillOnLogin = await isVisible(emailInput, 2_000);

  if (stillOnLogin) {
    throw new Error("CMS login failed for E2E user. Verify CMS_E2E_EMAIL/CMS_E2E_PASSWORD.");
  }
}

test("CMS admin rich-text toolbar click-path works on create post", async ({ page }) => {
  await loginIfNeeded(page);

  await page.goto("/cms/collections/blog-posts/create", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/cms\/collections\/blog-posts\/create/);

  const scopedEditor = page.locator('[data-field-path="content"] [contenteditable="true"]').first();
  const fallbackEditor = page.locator('[contenteditable="true"]').first();
  const editor = (await isVisible(scopedEditor, 10_000)) ? scopedEditor : fallbackEditor;

  await expect(editor).toBeVisible();
  await editor.click();
  await editor.fill("Toolbar smoke test copy");

  const boldButton = page.getByRole("button", { name: /Bold/i }).first();
  await expect(boldButton).toBeVisible();
  await boldButton.click();

  const italicButton = page.getByRole("button", { name: /Italic/i }).first();
  await expect(italicButton).toBeVisible();
  await italicButton.click();

  await expect(editor).toContainText("Toolbar smoke test copy");
});
