export interface RemioDesktopBridge {
  isDesktop: boolean;
  platform: string;
  version: string;
  startGoogleSignIn: () => Promise<void>;
}

export function getRemioDesktop(): RemioDesktopBridge | undefined {
  return (window as Window & { remioDesktop?: RemioDesktopBridge }).remioDesktop;
}

export function isRemioDesktop(): boolean {
  return getRemioDesktop()?.isDesktop === true;
}
