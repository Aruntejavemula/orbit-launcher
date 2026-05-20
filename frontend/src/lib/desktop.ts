export interface SessionFetchResult {
  status: number;
  statusText: string;
  data: unknown;
  ok: boolean;
}

export type StoreUpdateResult = {
  ok: boolean;
  status: string;
  count?: number;
  mandatory?: boolean;
  message?: string;
};

export interface RemioDesktopBridge {
  isDesktop: boolean;
  platform: string;
  version: string;
  startGoogleSignIn: () => Promise<void>;
  sessionFetch?: (path: string, init?: { method?: string; body?: unknown }) => Promise<SessionFetchResult>;
  isStoreInstall?: () => Promise<boolean>;
  checkStoreUpdates?: () => Promise<StoreUpdateResult>;
}

export function getRemioDesktop(): RemioDesktopBridge | undefined {
  return (window as Window & { remioDesktop?: RemioDesktopBridge }).remioDesktop;
}

export function isRemioDesktop(): boolean {
  return getRemioDesktop()?.isDesktop === true;
}
