const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("remioDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "0.1.0",
  startGoogleSignIn: () => ipcRenderer.invoke("google-sign-in"),
  sessionFetch: (path, init) => ipcRenderer.invoke("remio-session-fetch", { path, method: init?.method ?? "GET", body: init?.body }),
});
