import { test, expect, openAuthenticatedHome, ensureAppReady } from "./fixtures";

test.describe("Sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await openAuthenticatedHome(page);
    await ensureAppReady(page);
  });

  test("clicking Insights nav goes to /insights", async ({ page }) => {
    await page.getByRole("button", { name: "Insights" }).click();
    await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible({ timeout: 8000 });
  });

  test("clicking Settings nav goes to /settings", async ({ page }) => {
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 8000 });
  });

  test("clicking Home nav goes back to home", async ({ page }) => {
    await page.getByRole("button", { name: "Insights" }).click();
    await ensureAppReady(page);
    await page.getByRole("button", { name: "All Apps" }).click();
    await expect(page.getByPlaceholder(/search and launch/i)).toBeVisible({ timeout: 8000 });
  });
});
