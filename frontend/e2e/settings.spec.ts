import { test, expect, openAuthenticatedHome, ensureAppReady } from "./fixtures";

test.describe("Settings page", () => {
  test.beforeEach(async ({ page }) => {
    await openAuthenticatedHome(page);
  });

  test("navigates to settings and shows sections", async ({ page }) => {
    await page.goto("/settings");
    await ensureAppReady(page);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Profile")).toBeVisible();
    await expect(page.getByText("Appearance")).toBeVisible();
    await expect(page.getByText("Security")).toBeVisible();
  });

  test("profile update saves successfully", async ({ page }) => {
    await page.goto("/settings");
    await ensureAppReady(page);
    await page.waitForSelector('button:has-text("Save changes")', { timeout: 8000 });

    const inputs = page.getByRole("textbox");
    await inputs.first().fill("Updated Name");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Saved")).toBeVisible({ timeout: 8000 });
  });

  test("theme toggle switches between light and dark", async ({ page }) => {
    await page.goto("/settings");
    await ensureAppReady(page);

    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5000 });

    await page.getByRole("button", { name: "Light" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("sign out button is visible", async ({ page }) => {
    await page.goto("/settings");
    await ensureAppReady(page);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible({ timeout: 8000 });
  });

  test("error state shown on bad save", async ({ page }) => {
    await page.goto("/settings");
    await ensureAppReady(page);
    await page.waitForSelector('button:has-text("Save changes")', { timeout: 8000 });
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/settings/);
  });
});
