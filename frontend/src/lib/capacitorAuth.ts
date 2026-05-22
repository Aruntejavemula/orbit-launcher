import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import api from "../api";
import { getApiOrigin } from "./apiOrigin";
import { isCapacitorNative } from "./capacitor";
import { saveCapacitorTokenFromAuthBody } from "./capacitorSession";
import { markPendingRememberPrompt } from "./rememberDevicePrompt";

let listenerReady = false;

function parseRemioCallback(url: string): { code: string } | { error: true } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "remio:") return null;
  const pathOnly = parsed.pathname.replace(/\/$/, "") || "/";
  const path = parsed.host ? `/${parsed.host}${pathOnly === "/" ? "" : pathOnly}` : pathOnly;
  if (path !== "/auth/callback") return null;
  if (parsed.searchParams.get("error")) return { error: true };
  const code = parsed.searchParams.get("code");
  if (!code) return null;
  return { code };
}

export async function startCapacitorGoogleSignIn(): Promise<void> {
  const origin = getApiOrigin();
  if (!origin) throw new Error("API origin is not configured.");
  const url = `${origin}/api/auth/google?platform=desktop&desktop=1`;
  await Browser.open({ url, presentationStyle: "popover" });
}

export function registerCapacitorOAuthListener(handlers: {
  onSuccess: () => Promise<void>;
  onError: () => void;
}): void {
  if (!isCapacitorNative() || listenerReady) return;
  listenerReady = true;

  void App.addListener("appUrlOpen", async ({ url }) => {
    const payload = parseRemioCallback(url);
    if (!payload) return;

    try {
      await Browser.close();
    } catch {
      /* already closed */
    }

    if ("error" in payload) {
      handlers.onError();
      return;
    }

    try {
      const res = await api.post("/auth/desktop/session", { code: payload.code });
      saveCapacitorTokenFromAuthBody(res.data);
      markPendingRememberPrompt();
      await handlers.onSuccess();
    } catch {
      handlers.onError();
    }
  });
}
