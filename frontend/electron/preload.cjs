const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("remioDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "1.0.0",
  startGoogleSignIn: () => ipcRenderer.invoke("google-sign-in"),
  sessionFetch: (path, init) => ipcRenderer.invoke("remio-session-fetch", { path, method: init?.method ?? "GET", body: init?.body }),
  isStoreInstall: () => ipcRenderer.invoke("remio-is-store-install"),
  checkStoreUpdates: () => ipcRenderer.invoke("remio-check-store-updates"),
});
