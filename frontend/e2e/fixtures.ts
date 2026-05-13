import { test as base, type Page } from "@playwright/test";

const TEST_EMAIL = `e2e-${Date.now()}@test.remio.app`;
const TEST_PASSWORD = "E2eTestPwd1!";
const TEST_NAME = "E2E User";

export { TEST_EMAIL, TEST_PASSWORD, TEST_NAME };

export async function registerAndLogin(page: Page) {
  await page.goto("/");
  // Switch to register tab
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByPlaceholder("Your name").fill(TEST_NAME);
  await page.getByPlaceholder("you@example.com").fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  // After register, sign in
  await page.waitForURL(/\/(home|$)/, { timeout: 15_000 });
}

export async function loginExisting(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).last().click();
  // "Remember me" prompt
  const rememberBtn = page.getByRole("button", { name: /this device only|yes/i });
  if (await rememberBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await rememberBtn.click();
  }
  await page.waitForURL(/\/(home|$)/, { timeout: 15_000 });
}

export const test = base;
export { expect } from "@playwright/test";
