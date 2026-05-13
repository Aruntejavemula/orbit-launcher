export const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export { sendDesktopNotification, notifySubscriptionReminder, notifyInactivity, requestNotificationPermission, getDesktopNotificationsEnabled, setDesktopNotificationsEnabled } from "./notifications";
export { isAutoStartEnabled, enableAutoStart, disableAutoStart } from "./autostart";
