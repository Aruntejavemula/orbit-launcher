import { test, expect, switchToRegister, openLoginPage } from "./fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Error and edge states", () => {
  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible({ timeout: 10_000 });
  });

  test("404 route does not crash app", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("login page renders correctly without auth", async ({ page }) => {
    await openLoginPage(page);
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("register with weak password shows validation error", async ({ page }) => {
    await switchToRegister(page);
    await page.getByPlaceholder("Your name").fill("Test User");
    await page.getByPlaceholder("you@example.com").fill(`weak-${Date.now()}@test.remio.app`);
    await page.locator('input[type="password"]').fill("weak");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible({ timeout: 8000 });
  });
});
