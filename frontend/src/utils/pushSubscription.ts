import api from "../api";
import { registerNativePush, unregisterNativePush } from "../lib/capacitorPush";
import { isCapacitorNative } from "../lib/capacitor";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

async function subscribeWebPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    const { data } = await api.get("/push/vapid-key");
    const vapidKey = data.public_key;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const json = subscription.toJSON();
    await api.post("/push/subscribe", {
      platform: "web",
      endpoint: json.endpoint,
      p256dh: json.keys!.p256dh,
      auth: json.keys!.auth,
    });

    return true;
  } catch {
    return false;
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (isCapacitorNative()) return registerNativePush();
  return subscribeWebPush();
}

export async function unsubscribeFromPush(): Promise<void> {
  if (isCapacitorNative()) {
    await unregisterNativePush();
    return;
  }

  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const json = subscription.toJSON();
      await api.delete("/push/unsubscribe", {
        data: {
          platform: "web",
          endpoint: json.endpoint,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        },
      });
      await subscription.unsubscribe();
    }
  } catch {
    // Silent fail
  }
}
