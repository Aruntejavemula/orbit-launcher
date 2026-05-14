import { isNative } from "./platform";

export async function registerPushNotifications(): Promise<void> {
  if (!isNative) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  await PushNotifications.register();

  PushNotifications.addListener("registration", (token) => {
    console.log("Push registration token:", token.value);
    // TODO: Send token to backend for push delivery
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("Push registration error:", error);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push notification received:", notification);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("Push notification action:", action);
  });
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  id: number = Date.now(),
): Promise<void> {
  if (!isNative) return;

  const { LocalNotifications } = await import("@capacitor/local-notifications");

  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== "granted") return;

  await LocalNotifications.schedule({
    notifications: [
      {
        title,
        body,
        id,
        schedule: { at: new Date(Date.now() + 1000) },
      },
    ],
  });
}
