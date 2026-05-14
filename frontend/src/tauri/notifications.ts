const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

const NOTIF_PREF_KEY = "remio_desktop_notifications";

export function getDesktopNotificationsEnabled(): boolean {
  if (!isTauri) return false;
  const val = localStorage.getItem(NOTIF_PREF_KEY);
  return val === null ? true : val === "true";
}

export function setDesktopNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIF_PREF_KEY, String(enabled));
}

type NotificationPlugin = typeof import("@tauri-apps/plugin-notification");
let notifModule: NotificationPlugin | null = null;

async function loadNotificationPlugin(): Promise<NotificationPlugin | null> {
  if (!isTauri) return null;
  if (!notifModule) {
    notifModule = await import("@tauri-apps/plugin-notification");
  }
  return notifModule;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const mod = await loadNotificationPlugin();
  if (!mod) return false;

  try {
    let granted = await mod.isPermissionGranted();
    if (!granted) {
      const result = await mod.requestPermission();
      granted = result === "granted";
    }
    return granted;
  } catch (err) {
    console.warn("Notification permission check failed:", err);
    return false;
  }
}

export async function sendDesktopNotification(
  title: string,
  body: string
): Promise<void> {
  if (!getDesktopNotificationsEnabled()) return;

  const mod = await loadNotificationPlugin();
  if (!mod) return;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await mod.sendNotification({ title, body });
  } catch (err) {
    console.warn("Failed to send notification:", err);
  }
}

export async function notifySubscriptionReminder(
  appName: string,
  daysUntilRenewal: number
): Promise<void> {
  await sendDesktopNotification(
    "Subscription Reminder",
    `${appName} renews in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? "" : "s"}.`
  );
}

export async function notifyInactivity(
  appName: string,
  daysSinceUsed: number,
  level: "warning" | "critical"
): Promise<void> {
  const body =
    level === "critical"
      ? `You haven't used ${appName} in ${daysSinceUsed} days. Consider unsubscribing?`
      : `${appName} hasn't been used for ${daysSinceUsed} days.`;

  await sendDesktopNotification(
    level === "critical" ? "Unused Subscription Alert" : "Inactivity Notice",
    body
  );
}

export { isTauri };
