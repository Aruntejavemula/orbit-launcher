import { test, expect, openAuthenticatedHome, ensureAppReady } from "./fixtures";

test.describe("API Keys page", () => {
  test.beforeEach(async ({ page }) => {
    await openAuthenticatedHome(page);
  });

  test("page loads with generate key button", async ({ page }) => {
    await page.goto("/api-keys");
    await ensureAppReady(page);
    await expect(page.getByRole("button", { name: /generate key/i })).toBeVisible({ timeout: 8000 });
  });

  test("generates a key and shows secret once", async ({ page }) => {
    await page.goto("/api-keys");
    await ensureAppReady(page);

    await page.getByPlaceholder(/zapier integration/i).fill("My E2E Key");
    await page.getByRole("button", { name: /generate key/i }).click();

    await expect(page.getByRole("button", { name: "Copy" })).toBeVisible({ timeout: 8000 });
  });

  test("generated key appears in list after creation", async ({ page }) => {
    await page.goto("/api-keys");
    await ensureAppReady(page);

    await page.getByPlaceholder(/zapier integration/i).fill("E2E List Key");
    await page.getByRole("button", { name: /generate key/i }).click();
    await page.getByRole("button", { name: /done/i }).click().catch(() => {});

    await expect(page.getByText("E2E List Key")).toBeVisible({ timeout: 8000 });
  });

  test("revokes a key and removes it from list", async ({ page }) => {
    await page.goto("/api-keys");
    await ensureAppReady(page);

    await page.getByPlaceholder(/zapier integration/i).fill("Revoke Me");
    await page.getByRole("button", { name: /generate key/i }).click();
    await page.getByRole("button", { name: /done/i }).click().catch(() => {});

    await expect(page.getByText("Revoke Me")).toBeVisible({ timeout: 8000 });

    await page.getByRole("button", { name: "Revoke key" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Revoke" }).click();
    await expect(page.locator(".font-semibold", { hasText: "Revoke Me" })).toHaveCount(0, {
      timeout: 8000,
    });
  });
});
