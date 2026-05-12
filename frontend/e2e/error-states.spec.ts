import { test, expect } from "./fixtures";

test.describe("Error and edge states", () => {
  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/home");
    await page.waitForURL(/login/, { timeout: 8000 });
    await expect(page).toHaveURL(/login/);
  });

  test("404 route does not crash app", async ({ page }) => {
    // Not authenticated — goes to login, which is fine
    await page.goto("/this-route-does-not-exist");
    // Should either redirect to login or show a 404, but not a blank page crash
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("login page renders correctly without auth", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible({ timeout: 8000 });
  });

  test("register with weak password shows validation error", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByPlaceholder("Your name").fill("Test User");
    await page.getByPlaceholder("you@example.com").fill(`weak-${Date.now()}@test.remio.app`);
    await page.locator('input[type="password"]').fill("weak");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/password|at least/i)).toBeVisible({ timeout: 8000 });
  });
});
