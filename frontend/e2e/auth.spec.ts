import {
  test,
  expect,
  TEST_PASSWORD,
  TEST_NAME,
  uniqueEmail,
  switchToRegister,
  registerUser,
  openLoginPage,
  submitSignIn,
  expectLoggedOut,
  signOutFromSettings,
  openAuthenticatedHome,
} from "./fixtures";

test.describe("Auth flow (unauthenticated)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("register redirects to home", async ({ page }) => {
    const email = uniqueEmail("e2e-reg");
    await registerUser(page, { email, name: TEST_NAME, password: TEST_PASSWORD });
    await expect(page.getByPlaceholder(/search and launch/i)).toBeVisible();
  });

  test("login with valid credentials redirects to home", async ({ page }) => {
    const email = uniqueEmail("e2e-login");
    await registerUser(page, { email, name: TEST_NAME, password: TEST_PASSWORD });
    await signOutFromSettings(page);

    await page.getByPlaceholder("you@example.com").fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await submitSignIn(page, false);
    await expect(page.getByPlaceholder(/search and launch/i)).toBeVisible({ timeout: 15_000 });
  });

  test("wrong password shows error", async ({ page }) => {
    await openLoginPage(page);
    await page.getByPlaceholder("you@example.com").fill("nobody@nowhere.test.remio.app");
    await page.locator('input[type="password"]').fill("wrongpassword1!");
    await submitSignIn(page, false);
    await expect(page.getByText(/wrong email or password/i)).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Auth flow (authenticated)", () => {
  test("sign out returns to login", async ({ page }) => {
    await openAuthenticatedHome(page);
    await signOutFromSettings(page);
  });
});
