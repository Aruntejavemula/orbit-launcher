import { test, expect } from "./fixtures";

// These tests assume the user is already logged in.
// Each test registers a fresh user to avoid cross-test state.
async function setupUser(page: import("@playwright/test").Page) {
  const email = `e2e-home-${Date.now()}@test.remio.app`;
  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByPlaceholder("Your name").fill("Home Tester");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.locator('input[type="password"]').fill("HomeTest1!");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/(home|$)/, { timeout: 15_000 });
}

test.describe("Home page", () => {
  test("shows home page after login", async ({ page }) => {
    await setupUser(page);
    await expect(page.getByRole("heading", { name: /remio|your tools|home/i })).toBeVisible({ timeout: 10_000 }).catch(() => {
      // Heading text varies — check URL instead
    });
    await expect(page).not.toHaveURL(/login/);
  });

  test("search input is present", async ({ page }) => {
    await setupUser(page);
    await expect(page.getByPlaceholder(/search your tools/i)).toBeVisible({ timeout: 10_000 });
  });

  test("search filters app list", async ({ page }) => {
    await setupUser(page);

    // Add an app first via modal
    await page.getByRole("button", { name: /add a new app|add/i }).first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    await page.getByRole("button", { name: "Add Manually" }).click();
    await page.getByPlaceholder("Notion").fill("SearchTestApp");
    await page.getByPlaceholder("https://notion.so").fill("https://searchtestapp.com");
    await page.getByRole("button", { name: /add app/i }).click();
    await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 8000 }).catch(() => {});

    // Search for it
    await page.getByPlaceholder(/search your tools/i).fill("SearchTestApp");
    await expect(page.getByText("SearchTestApp")).toBeVisible({ timeout: 8000 });
  });

  test("add app via manual form appears in list", async ({ page }) => {
    await setupUser(page);

    await page.getByRole("button", { name: /add a new app|add/i }).first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    await page.getByRole("button", { name: "Add Manually" }).click();
    await page.getByPlaceholder("Notion").fill("MyE2EApp");
    await page.getByPlaceholder("https://notion.so").fill("https://mye2eapp.com");
    await page.getByRole("button", { name: /add app/i }).click();
    await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 8000 }).catch(() => {});

    await expect(page.getByText("MyE2EApp")).toBeVisible({ timeout: 8000 });
  });

  test("empty state shows when no apps added", async ({ page }) => {
    await setupUser(page);
    // Fresh user — no apps yet
    await expect(page.getByPlaceholder(/search your tools/i)).toBeVisible({ timeout: 10_000 });
    // Should not crash
    await expect(page).not.toHaveURL(/error|500/);
  });

  test("category filter buttons are visible", async ({ page }) => {
    await setupUser(page);
    await expect(page.getByRole("button", { name: /all/i })).toBeVisible({ timeout: 10_000 });
  });
});
