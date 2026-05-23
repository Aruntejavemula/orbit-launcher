/**
 * Client-side notification polling for Electron.
 *
 * Electron does not support the Web Push protocol (no PushManager / GCM).
 * Instead we periodically fetch the user's apps and reminders from the API,
 * compute which reminders are due today, and show native desktop
 * notifications via the Web Notification constructor (supported in Electron's
 * Chromium renderer).
 */
import api from "../api";

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const SHOWN_KEY = "remio_electron_notif_shown";
const DEFAULT_AUTOMATED_DAYS = [3, 1];

let intervalId: ReturnType<typeof setInterval> | null = null;

interface AppData {
  id: string;
  name: string;
  plan: string;
  expires_at: string | null;
}

interface ReminderData {
  id: string;
  app_id: string;
  remind_days_before: number;
  method: string;
  active: boolean;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getShownSet(): Set<string> {
  try {
    const raw = localStorage.getItem(SHOWN_KEY);
    if (!raw) return new Set();
    const parsed: { date: string; keys: string[] } = JSON.parse(raw);
    if (parsed.date !== todayKey()) return new Set();
    return new Set(parsed.keys);
  } catch {
    return new Set();
  }
}

function markShown(key: string): void {
  const shown = getShownSet();
  shown.add(key);
  try {
    localStorage.setItem(
      SHOWN_KEY,
      JSON.stringify({ date: todayKey(), keys: [...shown] }),
    );
  } catch {
    /* localStorage full */
  }
}

function daysUntilExpiry(expiresAt: string): number {
  const expiry = new Date(expiresAt);
  const now = new Date();
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - now.getTime()) / 86_400_000);
}

function planLabel(plan: string): string {
  return plan === "trial" ? "trial ends" : "renews";
}

function buildNotification(
  appName: string,
  plan: string,
  daysLeft: number,
): { title: string; body: string } {
  const label = planLabel(plan);
  if (daysLeft === 0) {
    return {
      title: `${appName} ${label} today`,
      body: `Your ${appName} subscription ${label} today.`,
    };
  }
  if (daysLeft === 1) {
    return {
      title: `${appName} ${label} tomorrow`,
      body: `Your ${appName} subscription ${label} tomorrow.`,
    };
  }
  return {
    title: `${appName} ${label} in ${daysLeft} days`,
    body: `Your ${appName} subscription ${label} in ${daysLeft} days.`,
  };
}

async function checkAndNotify(): Promise<void> {
  if (
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    const [appsRes, remindersRes] = await Promise.all([
      api.get("/apps"),
      api.get("/reminders"),
    ]);
    const apps: AppData[] = appsRes.data;
    const reminders: ReminderData[] = remindersRes.data;
    const appMap = new Map(apps.map((a) => [a.id, a]));
    const shown = getShownSet();

    // Per-app push reminders
    for (const r of reminders) {
      if (!r.active || r.method !== "push") continue;
      const app = appMap.get(r.app_id);
      if (!app?.expires_at) continue;

      const daysLeft = daysUntilExpiry(app.expires_at);
      if (daysLeft < 0 || daysLeft !== r.remind_days_before) continue;

      const key = `${r.id}`;
      if (shown.has(key)) continue;

      const { title, body } = buildNotification(app.name, app.plan, daysLeft);
      new Notification(title, { body, icon: "/icon-512x512.png" });
      markShown(key);
    }

    // Default automated reminders (3-day, 1-day)
    const appsWithExplicit = new Set(
      reminders.filter((r) => r.active).map((r) => r.app_id),
    );
    for (const app of apps) {
      if (!app.expires_at) continue;
      if (appsWithExplicit.has(app.id)) continue;

      const daysLeft = daysUntilExpiry(app.expires_at);
      if (!DEFAULT_AUTOMATED_DAYS.includes(daysLeft)) continue;

      const key = `auto:${app.id}:${daysLeft}`;
      if (shown.has(key)) continue;

      const { title, body } = buildNotification(app.name, app.plan, daysLeft);
      new Notification(title, { body, icon: "/icon-512x512.png" });
      markShown(key);
    }
  } catch {
    // Silent fail — will retry next interval
  }
}

export function startElectronNotifications(): void {
  if (intervalId) return;
  void checkAndNotify();
  intervalId = setInterval(() => void checkAndNotify(), CHECK_INTERVAL_MS);
}

export function stopElectronNotifications(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function isElectronNotificationsRunning(): boolean {
  return intervalId !== null;
}
