import { test, expect } from "./fixtures";

async function setupUser(page: import("@playwright/test").Page) {
  const email = `e2e-insights-${Date.now()}@test.remio.app`;
  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByPlaceholder("Your name").fill("Insights Tester");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.locator('input[type="password"]').fill("InsightsTest1!");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/(home|$)/, { timeout: 15_000 });
}

test.describe("Insights page", () => {
  test("page loads without crashing", async ({ page }) => {
    await setupUser(page);
    await page.goto("/insights");
    await expect(page).not.toHaveURL(/error|500/);
  });

  test("shows Insights heading", async ({ page }) => {
    await setupUser(page);
    await page.goto("/insights");
    await expect(page.getByText(/insights/i)).toBeVisible({ timeout: 8000 });
  });

  test("shows spending section", async ({ page }) => {
    await setupUser(page);
    await page.goto("/insights");
    await expect(page.getByText(/spending|monthly cost/i)).toBeVisible({ timeout: 8000 });
  });

  test("shows renewals section", async ({ page }) => {
    await setupUser(page);
    await page.goto("/insights");
    await expect(page.getByText(/renewals|upcoming/i)).toBeVisible({ timeout: 8000 });
  });
});
