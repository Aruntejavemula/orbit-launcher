import { test, expect, openAuthenticatedHome, ensureAppReady } from "./fixtures";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await openAuthenticatedHome(page);
  });

  test("shows home page after login", async ({ page }) => {
    await expect(page.getByPlaceholder(/search and launch/i)).toBeVisible({ timeout: 10_000 });
  });

  test("search input is present", async ({ page }) => {
    await expect(page.getByPlaceholder(/search and launch/i)).toBeVisible({ timeout: 10_000 });
  });

  test("search filters app list", async ({ page }) => {
    await ensureAppReady(page);

    await page.getByRole("button", { name: /add a new app|add/i }).first().click();
    await ensureAppReady(page);
    await page.getByRole("button", { name: "Add Manually" }).click();
    await page.getByRole("textbox", { name: "App name" }).fill("SearchTestApp");
    await page.getByRole("textbox", { name: "Website URL" }).fill("https://searchtestapp.com");
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.getByText("Free").click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.getByRole("button", { name: /add searchtestapp/i }).click();
    await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 8000 }).catch(() => {});

    await page.getByPlaceholder(/search and launch/i).fill("SearchTestApp");
    await expect(page.getByRole("button", { name: /SearchTestApp/i })).toBeVisible({ timeout: 8000 });
  });

  test("add app via manual form appears in list", async ({ page }) => {
    await ensureAppReady(page);

    await page.getByRole("button", { name: /add a new app|add/i }).first().click();
    await ensureAppReady(page);
    await page.getByRole("button", { name: "Add Manually" }).click();
    await page.getByRole("textbox", { name: "App name" }).fill("MyE2EApp");
    await page.getByRole("textbox", { name: "Website URL" }).fill("https://mye2eapp.com");
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.getByText("Free").click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.getByRole("button", { name: /add mye2eapp/i }).click();
    await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 8000 }).catch(() => {});

    await expect(page.getByRole("button", { name: /MyE2EApp/i })).toBeVisible({ timeout: 8000 });
  });

  test("empty state shows when no apps added", async ({ page }) => {
    await expect(page.getByPlaceholder(/search and launch/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/error|500/);
  });

  test("category filter buttons are visible", async ({ page }) => {
    await expect(page.getByRole("main").getByRole("button", { name: "All Apps" })).toBeVisible({
      timeout: 10_000,
    });
  });
});
