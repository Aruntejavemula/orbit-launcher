import { test, expect } from "./fixtures";

async function setupUser(page: import("@playwright/test").Page) {
  const email = `e2e-keys-${Date.now()}@test.remio.app`;
  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByPlaceholder("Your name").fill("Keys Tester");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.locator('input[type="password"]').fill("KeysTest1!");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/(home|$)/, { timeout: 15_000 });
}

test.describe("API Keys page", () => {
  test("page loads with generate key button", async ({ page }) => {
    await setupUser(page);
    await page.goto("/api-keys");
    await expect(page.getByRole("button", { name: /generate key/i })).toBeVisible({ timeout: 8000 });
  });

  test("generates a key and shows secret once", async ({ page }) => {
    await setupUser(page);
    await page.goto("/api-keys");

    await page.getByPlaceholder(/zapier integration/i).fill("My E2E Key");
    await page.getByRole("button", { name: /generate key/i }).click();

    // Secret shown in a one-time display
    await expect(page.getByText(/copy/i)).toBeVisible({ timeout: 8000 });
  });

  test("generated key appears in list after creation", async ({ page }) => {
    await setupUser(page);
    await page.goto("/api-keys");

    await page.getByPlaceholder(/zapier integration/i).fill("E2E List Key");
    await page.getByRole("button", { name: /generate key/i }).click();

    // Dismiss secret view
    await page.getByRole("button", { name: /done/i }).click().catch(() => {});

    await expect(page.getByText("E2E List Key")).toBeVisible({ timeout: 8000 });
  });

  test("revokes a key and removes it from list", async ({ page }) => {
    await setupUser(page);
    await page.goto("/api-keys");

    await page.getByPlaceholder(/zapier integration/i).fill("Revoke Me");
    await page.getByRole("button", { name: /generate key/i }).click();
    await page.getByRole("button", { name: /done/i }).click().catch(() => {});

    await expect(page.getByText("Revoke Me")).toBeVisible({ timeout: 8000 });

    await page.getByRole("button", { name: /revoke key/i }).first().click();
    await expect(page.getByText("Revoke Me")).not.toBeVisible({ timeout: 8000 });
  });
});
