import { isNative } from "./platform";

export async function configureStatusBar(isDark: boolean): Promise<void> {
  if (!isNative) return;

  const { StatusBar, Style } = await import("@capacitor/status-bar");

  await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
  await StatusBar.setBackgroundColor({
    color: isDark ? "#1a1a2e" : "#f8faf5",
  });
}
