const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

type UpdaterPlugin = typeof import("@tauri-apps/plugin-updater");
let updaterModule: UpdaterPlugin | null = null;

async function loadUpdaterPlugin(): Promise<UpdaterPlugin | null> {
  if (!isTauri) return null;
  if (!updaterModule) {
    updaterModule = await import("@tauri-apps/plugin-updater");
  }
  return updaterModule;
}

export interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  const mod = await loadUpdaterPlugin();
  if (!mod) return { available: false };

  try {
    const update = await mod.check();
    if (update) {
      return {
        available: true,
        version: update.version,
        body: update.body ?? undefined,
      };
    }
  } catch (err) {
    console.warn("Update check failed:", err);
  }
  return { available: false };
}

export async function downloadAndInstallUpdate(): Promise<void> {
  const mod = await loadUpdaterPlugin();
  if (!mod) return;

  const update = await mod.check();
  if (update) {
    await update.downloadAndInstall();
    const processPlugin = await import("@tauri-apps/plugin-process");
    await processPlugin.relaunch();
  }
}
