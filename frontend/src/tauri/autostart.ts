const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

type AutostartPlugin = typeof import("@tauri-apps/plugin-autostart");
let autostartModule: AutostartPlugin | null = null;

async function loadPlugin(): Promise<AutostartPlugin | null> {
  if (!isTauri) return null;
  if (!autostartModule) {
    autostartModule = await import("@tauri-apps/plugin-autostart");
  }
  return autostartModule;
}

export async function isAutoStartEnabled(): Promise<boolean> {
  const mod = await loadPlugin();
  if (!mod) return false;
  return mod.isEnabled();
}

export async function enableAutoStart(): Promise<void> {
  const mod = await loadPlugin();
  if (!mod) return;
  await mod.enable();
}

export async function disableAutoStart(): Promise<void> {
  const mod = await loadPlugin();
  if (!mod) return;
  await mod.disable();
}
