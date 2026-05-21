import { test, expect, openAuthenticatedHome, ensureAppReady } from "./fixtures";

test.describe("Insights page", () => {
  test.beforeEach(async ({ page }) => {
    await openAuthenticatedHome(page);
  });

  test("page loads without crashing", async ({ page }) => {
    await page.goto("/insights");
    await expect(page).not.toHaveURL(/error|500/);
  });

  test("shows Insights heading", async ({ page }) => {
    await page.goto("/insights");
    await ensureAppReady(page);
    await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible({ timeout: 8000 });
  });

  test("shows spending section", async ({ page }) => {
    await page.goto("/insights");
    await ensureAppReady(page);
    await expect(page.getByText(/monthly spend/i)).toBeVisible({ timeout: 8000 });
  });

  test("shows renewals section", async ({ page }) => {
    await page.goto("/insights");
    await ensureAppReady(page);
    await expect(
      page.getByRole("heading", { name: /renewing in the next 7 days/i }),
    ).toBeVisible({ timeout: 8000 });
  });
});
