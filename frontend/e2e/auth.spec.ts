import { test, expect, TEST_EMAIL, TEST_PASSWORD, TEST_NAME } from "./fixtures";

test.describe("Auth flow", () => {
  test("register redirects to home", async ({ page }) => {
    const email = `e2e-reg-${Date.now()}@test.remio.app`;
    await page.goto("/");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByPlaceholder("Your name").fill(TEST_NAME);
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/(home|$)/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/login/);
  });

  test("login with valid credentials redirects to home", async ({ page }) => {
    const email = `e2e-login-${Date.now()}@test.remio.app`;
    // Register first
    await page.goto("/");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByPlaceholder("Your name").fill(TEST_NAME);
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/(home|$)/, { timeout: 15_000 });

    // Sign out
    await page.goto("/settings");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByRole("button", { name: "Sign out" }).last().click();
    await page.waitForURL(/login/, { timeout: 10_000 });

    // Log back in
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).last().click();
    await page.waitForURL(/\/(home|$)/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/login/);
  });

  test("wrong password shows error", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("you@example.com").fill("nobody@nowhere.invalid");
    await page.locator('input[type="password"]').fill("wrongpassword1!");
    await page.getByRole("button", { name: "Sign in" }).last().click();
    // "Remember me" prompt may appear — dismiss it
    const rememberBtn = page.getByRole("button", { name: /this device only/i });
    if (await rememberBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rememberBtn.click();
    }
    await expect(page.getByText(/wrong email or password|invalid credentials|something went wrong/i)).toBeVisible({ timeout: 8000 });
  });

  test("sign out returns to login", async ({ page }) => {
    const email = `e2e-so-${Date.now()}@test.remio.app`;
    await page.goto("/");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByPlaceholder("Your name").fill(TEST_NAME);
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/(home|$)/, { timeout: 15_000 });

    await page.goto("/settings");
    await page.getByRole("button", { name: "Sign out" }).click();
    // Confirm dialog
    await page.getByRole("button", { name: "Sign out" }).last().click();
    await page.waitForURL(/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);
  });
});
