const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("remioDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "0.1.0",
  startGoogleSignIn: () => ipcRenderer.invoke("google-sign-in"),
});
