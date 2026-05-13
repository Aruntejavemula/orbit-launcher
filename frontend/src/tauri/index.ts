export const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export { sendDesktopNotification, notifySubscriptionReminder, notifyInactivity, requestNotificationPermission, getDesktopNotificationsEnabled, setDesktopNotificationsEnabled } from "./notifications";
export { checkForUpdates, downloadAndInstallUpdate } from "./updater";
export type { UpdateInfo } from "./updater";
export { isAutoStartEnabled, enableAutoStart, disableAutoStart } from "./autostart";
