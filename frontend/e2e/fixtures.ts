import { test as base, expect, type Page } from "@playwright/test";

export const TEST_PASSWORD = "E2eTestPwd1!";
export const TEST_NAME = "E2E User";

export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}@test.remio.app`;
}

/** Wait for splash + login form (app uses `/`, not `/login`). */
export async function openLoginPage(page: Page) {
  await page.goto("/");
  await page.getByPlaceholder("you@example.com").waitFor({ state: "visible", timeout: 20_000 });
}

export async function switchToRegister(page: Page) {
  await openLoginPage(page);
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByPlaceholder("Your name").waitFor({ state: "visible", timeout: 8000 });
}

export async function dismissRememberPrompt(page: Page, remember = false) {
  const dialog = page.getByRole("dialog", { name: /remember this device/i });
  if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page
      .getByRole("button", { name: remember ? "Yes, remember" : "No thanks" })
      .click();
  }
}

export async function submitSignIn(page: Page, remember = false) {
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();
  await dismissRememberPrompt(page, remember);
}

export async function dismissBudgetNudge(page: Page) {
  const notNow = page.getByRole("button", { name: "Not now" });
  if (await notNow.isVisible({ timeout: 2000 }).catch(() => false)) {
    await notNow.click();
  }
}

const ONBOARDING_SCRIM = "div.fixed.inset-0.z-\\[9999\\].backdrop-blur-xl";

/** Dismiss onboarding scrim, budget nudge, and remember-device dialog. */
export async function ensureAppReady(page: Page) {
  await dismissRememberPrompt(page, false);

  const scrim = page.locator(ONBOARDING_SCRIM);
  for (let i = 0; i < 20; i++) {
    if (!(await scrim.isVisible().catch(() => false))) break;

    const skip = page.getByRole("button", { name: /^skip$/i });
    const saveBudget = page.getByRole("button", { name: /save & continue/i });
    const cont = page.getByRole("button", { name: /^continue$/i });

    if (await saveBudget.isVisible({ timeout: 400 }).catch(() => false)) {
      await Promise.all([
        page
          .waitForResponse(
            (r) => r.url().includes("/preferences") && r.request().method() === "PATCH",
            { timeout: 12_000 },
          )
          .catch(() => null),
        saveBudget.click({ force: true }),
      ]);
    } else if (await skip.isVisible({ timeout: 400 }).catch(() => false)) {
      await skip.click({ force: true });
    } else if (await cont.isVisible({ timeout: 400 }).catch(() => false)) {
      await cont.click({ force: true });
    } else {
      break;
    }
    await page.waitForTimeout(350);
  }

  await dismissBudgetNudge(page);
  await scrim.waitFor({ state: "hidden", timeout: 25_000 }).catch(() => {});
}

export async function skipOnboarding(page: Page) {
  const search = page.getByPlaceholder(/search and launch/i);
  const skipBtn = page.getByRole("button", { name: /^skip$/i });

  const state = await Promise.race([
    skipBtn.waitFor({ state: "visible", timeout: 25_000 }).then(() => "skip" as const),
    search.waitFor({ state: "visible", timeout: 25_000 }).then(() => "home" as const),
  ]).catch(() => "timeout" as const);

  if (state === "timeout") {
    throw new Error("skipOnboarding: home shell did not appear after register");
  }

  await ensureAppReady(page);
  await search.waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
}

export async function registerUser(
  page: Page,
  opts: { name?: string; email?: string; password?: string } = {},
) {
  const name = opts.name ?? TEST_NAME;
  const email = opts.email ?? uniqueEmail();
  const password = opts.password ?? TEST_PASSWORD;

  await switchToRegister(page);
  await page.getByPlaceholder("Your name").fill(name);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/auth/register") && r.status() >= 200 && r.status() < 300,
      { timeout: 25_000 },
    ),
    page.getByRole("button", { name: "Create account" }).click(),
  ]);
  await skipOnboarding(page);
  return { name, email, password };
}

export async function registerAndLogin(page: Page) {
  return registerUser(page);
}

export async function loginExisting(page: Page, email: string, password: string) {
  await openLoginPage(page);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await submitSignIn(page, false);
  await skipOnboarding(page);
}

export async function expectLoggedOut(page: Page) {
  await page.getByPlaceholder("you@example.com").waitFor({ state: "visible", timeout: 10_000 });
}

/** @deprecated Use ensureAppReady */
export async function readyAppShell(page: Page) {
  await ensureAppReady(page);
}

export async function signOutFromSettings(page: Page) {
  await page.goto("/settings");
  await ensureAppReady(page);
  const signOut = page.getByRole("button", { name: "Sign out" });
  await signOut.scrollIntoViewIfNeeded();
  await signOut.click({ force: true });
  await page.getByRole("dialog").getByRole("button", { name: "Sign out" }).click();
  await expectLoggedOut(page);
}

/** Open home as the shared authenticated user (see auth.setup.ts). */
export async function openAuthenticatedHome(page: Page) {
  await page.goto("/");
  await ensureAppReady(page);
}

export const test = base;
export { expect };
