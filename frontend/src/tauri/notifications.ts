const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

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

  let granted = await mod.isPermissionGranted();
  if (!granted) {
    const result = await mod.requestPermission();
    granted = result === "granted";
  }
  return granted;
}

export async function sendDesktopNotification(
  title: string,
  body: string
): Promise<void> {
  const mod = await loadNotificationPlugin();
  if (!mod) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await mod.sendNotification({ title, body });
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
