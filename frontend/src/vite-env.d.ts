/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface RemioDesktopBridge {
  isDesktop: boolean;
  platform: string;
  version: string;
  startGoogleSignIn: () => Promise<void>;
}

interface Window {
  remioDesktop?: RemioDesktopBridge;
}
