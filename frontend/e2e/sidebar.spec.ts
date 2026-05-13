import { test, expect } from "./fixtures";

async function setupUser(page: import("@playwright/test").Page) {
  const email = `e2e-sidebar-${Date.now()}@test.remio.app`;
  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByPlaceholder("Your name").fill("Sidebar Tester");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.locator('input[type="password"]').fill("SidebarTest1!");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/(home|$)/, { timeout: 15_000 });
}

test.describe("Sidebar navigation", () => {
  test("clicking Insights nav goes to /insights", async ({ page }) => {
    await setupUser(page);
    await page.getByRole("link", { name: /insights/i }).click();
    await page.waitForURL(/insights/, { timeout: 8000 });
    await expect(page).toHaveURL(/insights/);
  });

  test("clicking Settings nav goes to /settings", async ({ page }) => {
    await setupUser(page);
    await page.getByRole("link", { name: /settings/i }).click();
    await page.waitForURL(/settings/, { timeout: 8000 });
    await expect(page).toHaveURL(/settings/);
  });

  test("clicking Home nav goes back to home", async ({ page }) => {
    await setupUser(page);
    await page.goto("/settings");
    await page.getByRole("link", { name: /home|apps/i }).first().click();
    await page.waitForURL(/\/(home|$)/, { timeout: 8000 });
    await expect(page).not.toHaveURL(/settings/);
  });
});
