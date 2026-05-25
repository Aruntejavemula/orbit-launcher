import { PushNotifications } from "@capacitor/push-notifications";
import axios from "axios";
import api from "../api";
import { isCapacitorNative } from "./capacitor";
import { navigateAppRoot } from "./navigation";
import { getCapacitorAccessToken } from "./capacitorSession";
import { markPushPrimerSeen } from "./pushPrimerStorage";

const FCM_TOKEN_KEY = "remio_fcm_token";
const PUSH_CHANNEL_ID = "remio_reminders";

let listenersAttached = false;

function logFcmError(context: string, err: unknown): void {
  const msg =
    err && typeof err === "object" && "error" in err
      ? String((err as { error: unknown }).error)
      : String(err);
  console.error(`[Remio] ${context}:`, msg);
}

function saveFcmToken(token: string): void {
  try {
    localStorage.setItem(FCM_TOKEN_KEY, token);
  } catch {
    /* storage blocked */
  }
}

export function readFcmToken(): string | null {
  try {
    return localStorage.getItem(FCM_TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearFcmToken(): void {
  try {
    localStorage.removeItem(FCM_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function isNativePushPermissionGranted(): Promise<boolean> {
  if (!isCapacitorNative()) return false;
  const status = await PushNotifications.checkPermissions();
  return status.receive === "granted";
}

async function ensureDefaultPushChannel(): Promise<void> {
  try {
    await PushNotifications.createChannel({
      id: PUSH_CHANNEL_ID,
      name: "Reminders",
      description: "Subscription renewal reminders",
      importance: 4,
      visibility: 1,
    });
  } catch {
    /* channel may already exist */
  }
}

async function postFcmTokenToServer(token: string): Promise<boolean> {
  if (!getCapacitorAccessToken()) {
    console.warn("[Remio] push subscribe skipped — not logged in (no JWT)");
    return false;
  }
  const fcmToken = token.trim();
  if (!fcmToken) {
    console.warn("[Remio] push subscribe skipped — empty FCM token");
    return false;
  }
  try {
    await api.post("/push/subscribe", { platform: "android", fcm_token: fcmToken });
    console.info("[Remio] push subscribe: ok");
    return true;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error("[Remio] push subscribe: failed", err.response?.status, err.response?.data);
    } else {
      console.error("[Remio] push subscribe: failed", err);
    }
    return false;
  }
}

async function waitForFcmToken(ms = 15_000): Promise<string | null> {
  const existing = readFcmToken();
  if (existing) return existing;

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      void handle.then((h) => h.remove());
      resolve(readFcmToken());
    }, ms);

    const handle = PushNotifications.addListener("registration", (ev) => {
      clearTimeout(timer);
      void handle.then((h) => h.remove());
      if (ev.value) saveFcmToken(ev.value);
      resolve(ev.value ?? null);
    });
  });
}

async function startFcmRegistration(): Promise<void> {
  await ensureDefaultPushChannel();
  try {
    await PushNotifications.register();
  } catch (err) {
    logFcmError("PushNotifications.register() threw", err);
  }
}

/** Primer "Enable notifications" — user gesture → system dialog → FCM register. */
export async function enableNativePushFromPrimer(): Promise<{
  ok: boolean;
  reason?: "denied" | "no_token" | "error";
}> {
  if (!isCapacitorNative()) return { ok: false, reason: "error" };

  initNativePushListeners();

  let status = await PushNotifications.checkPermissions();
  if (status.receive === "prompt") {
    status = await PushNotifications.requestPermissions();
  }

  if (status.receive !== "granted") {
    return { ok: false, reason: "denied" };
  }

  await startFcmRegistration();
  const token = await waitForFcmToken();
  if (!token) {
    return { ok: false, reason: "no_token" };
  }

  markPushPrimerSeen();
  return { ok: true };
}

export function initNativePushListeners(): void {
  if (!isCapacitorNative() || listenersAttached) return;
  listenersAttached = true;

  void PushNotifications.addListener("registration", (ev) => {
    if (ev.value) {
      console.info("[Remio] FCM token received");
      saveFcmToken(ev.value);
    }
  });

  void PushNotifications.addListener("registrationError", (err) => {
    logFcmError("FCM registrationError (native)", err);
  });

  void PushNotifications.addListener("pushNotificationReceived", () => {});

  void PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = action.notification.data?.url;
    if (typeof url === "string" && url.startsWith("/")) {
      navigateAppRoot(url);
    }
  });
}

/**
 * Register FCM token with backend (requires JWT). Call after login saves access_token.
 */
export async function syncNativePushAfterLogin(): Promise<boolean> {
  if (!isCapacitorNative()) return false;
  if (!(await isNativePushPermissionGranted())) {
    console.warn("[Remio] push subscribe skipped — permission not granted");
    return false;
  }

  let token = readFcmToken();
  if (!token) {
    await startFcmRegistration();
    token = await waitForFcmToken(10_000);
  }
  if (!token) {
    console.warn("[Remio] push subscribe skipped — no FCM token");
    return false;
  }

  return postFcmTokenToServer(token);
}

export async function registerNativePush(): Promise<boolean> {
  if (!isCapacitorNative()) return false;

  initNativePushListeners();

  if (!(await isNativePushPermissionGranted())) {
    const requested = await PushNotifications.requestPermissions();
    if (requested.receive !== "granted") return false;
  }

  const cached = readFcmToken();
  if (cached) return postFcmTokenToServer(cached);

  await startFcmRegistration();
  const token = await waitForFcmToken();
  return token ? postFcmTokenToServer(token) : false;
}

export async function unregisterNativePush(): Promise<void> {
  if (!isCapacitorNative()) return;

  const token = readFcmToken();
  if (token) {
    try {
      await api.delete("/push/unsubscribe", {
        data: { platform: "android", fcm_token: token },
      });
    } catch {
      /* best effort */
    }
  }
  clearFcmToken();
  try {
    await PushNotifications.unregister();
  } catch {
    /* ignore */
  }
}
