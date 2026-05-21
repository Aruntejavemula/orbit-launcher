import { test as setup } from "@playwright/test";
import { ensureAppReady, registerUser, uniqueEmail } from "./fixtures";

const authFile = "e2e/.auth/user.json";

setup("authenticate shared user", async ({ page }) => {
  await registerUser(page, { email: uniqueEmail("e2e-shared") });
  await ensureAppReady(page);
  await page.getByPlaceholder(/search and launch/i).waitFor({ state: "visible", timeout: 20_000 });
  await page.context().storageState({ path: authFile });
});
