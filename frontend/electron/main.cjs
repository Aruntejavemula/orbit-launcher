const { app, BrowserWindow, shell, session, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { APP_URL, API_ORIGIN } = require("./config.cjs");

const isPackaged = app.isPackaged;
const openDevTools =
  process.env.REMIO_ELECTRON_DEBUG === "1" || process.argv.includes("--devtools");

const SESSION_PARTITION = "persist:remio";
const PROTOCOL = "remio";

let mainWindow = null;
let authWindow = null;
let desktopOAuthInFlight = false;

function isInAppHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "remiolauncher.com" ||
    hostname.endsWith(".remiolauncher.com")
  );
}

function isGoogleOAuthStartUrl(url) {
  try {
    const { pathname } = new URL(url);
    const p = pathname.replace(/\/$/, "");
    return p === "/api/auth/google" || p.endsWith("/auth/google");
  } catch {
    return false;
  }
}

function isOAuthErrorUrl(url) {
  return url.includes("google_error=1");
}

/**
 * URLs where the auth popup can close. Do NOT include /api/auth/google/callback —
 * that request must finish so the server can set the session (or remio:// redirect).
 */
function isOAuthTerminalUrl(url) {
  try {
    if (isOAuthErrorUrl(url)) return true;
    const u = new URL(url);
    if (!isInAppHost(u.hostname)) return false;
    const p = u.pathname.replace(/\/$/, "") || "/";
    return p === "/auth/callback";
  } catch {
    return false;
  }
}

async function finishOAuthFromCallback(url) {
  if (authWindow && !authWindow.isDestroyed()) authWindow.close();
  authWindow = null;
  const main = mainWindow ?? BrowserWindow.getAllWindows()[0];
  if (!main) return;

  if (isOAuthErrorUrl(url)) {
    await loadApp(main, errorLoadUrl());
    main.focus();
    return;
  }

  await loadApp(main);
  main.webContents.reload();
  main.focus();
}

function handleAuthWindowUrl(event, url) {
  if (url.startsWith(`${PROTOCOL}://`)) {
    if (event) event.preventDefault();
    void completeDesktopOAuth(url);
    return true;
  }
  if (isOAuthTerminalUrl(url)) {
    if (event) event.preventDefault();
    void finishOAuthFromCallback(url);
    return true;
  }
  return false;
}

async function openGoogleOAuthWindow() {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.focus();
    return;
  }
  authWindow = new BrowserWindow({
    width: 520,
    height: 720,
    parent: mainWindow ?? undefined,
    modal: Boolean(mainWindow),
    autoHideMenuBar: true,
    title: "Sign in with Google",
    webPreferences: {
      partition: SESSION_PARTITION,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  const wc = authWindow.webContents;
  wc.on("will-redirect", (event, url) => {
    handleAuthWindowUrl(event, url);
  });
  wc.on("will-navigate", (event, url) => {
    if (url.includes("accounts.google.com")) return;
    handleAuthWindowUrl(event, url);
  });
  authWindow.on("closed", () => {
    authWindow = null;
  });
  await authWindow.loadURL(`${API_ORIGIN}/api/auth/google?platform=desktop&desktop=1`);
}

function navigationTarget(url) {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol === "file:") return "in-app";
    return isInAppHost(hostname) ? "in-app" : "external";
  } catch {
    return "external";
  }
}

function handleWebContentsNavigation(event, url) {
  if (url.startsWith(`${PROTOCOL}://`)) {
    event.preventDefault();
    completeDesktopOAuth(url);
    return;
  }
  if (isGoogleOAuthStartUrl(url)) {
    event.preventDefault();
    void openGoogleOAuthWindow();
    return;
  }
  if (navigationTarget(url) === "external") {
    event.preventDefault();
    shell.openExternal(url);
  }
}

function registerProtocol() {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

function parseProtocolArg(argv) {
  return argv.find((arg) => typeof arg === "string" && arg.startsWith(`${PROTOCOL}://`));
}

function errorLoadUrl() {
  return `${API_ORIGIN}/?google_error=1`;
}

async function completeDesktopOAuth(rawUrl) {
  if (desktopOAuthInFlight) return;
  const win = mainWindow ?? BrowserWindow.getAllWindows()[0];
  if (!win) return;

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    await loadApp(win, errorLoadUrl());
    return;
  }

  const err = parsed.searchParams.get("error");
  const code = parsed.searchParams.get("code");
  if (err || !code) {
    await loadApp(win, errorLoadUrl());
    win.focus();
    return;
  }

  desktopOAuthInFlight = true;
  if (authWindow && !authWindow.isDestroyed()) authWindow.close();
  authWindow = null;

  const ses = session.fromPartition(SESSION_PARTITION);
  try {
    const res = await ses.fetch(`${API_ORIGIN}/api/auth/desktop/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      console.error("[Remio] desktop/session failed:", res.status, await res.text().catch(() => ""));
      await loadApp(win, errorLoadUrl());
      win.focus();
      return;
    }
    await loadApp(win);
    win.webContents.reload();
    win.focus();
  } catch (e) {
    console.error("[Remio] desktop OAuth session failed:", e);
    await loadApp(win, errorLoadUrl());
    win.focus();
  } finally {
    desktopOAuthInFlight = false;
  }
}

async function loadApp(win, overrideUrl) {
  if (overrideUrl) {
    if (overrideUrl.startsWith("file:") || (!overrideUrl.startsWith("http") && fs.existsSync(overrideUrl))) {
      await win.loadFile(overrideUrl);
    } else {
      await win.loadURL(overrideUrl);
    }
    return;
  }
  if (isPackaged) {
    await win.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
    return;
  }
  await win.loadURL(APP_URL);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: "Remio",
    webPreferences: {
      partition: SESSION_PARTITION,
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow = win;
  win.once("ready-to-show", () => win.show());
  win.webContents.on("did-fail-load", (_event, code, desc, url) => {
    console.error("[Remio] did-fail-load", code, desc, url);
    if (!win.isVisible()) win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (navigationTarget(url) === "external") shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", handleWebContentsNavigation);
  win.webContents.on("will-redirect", (event, url) => {
    if (url.startsWith(`${PROTOCOL}://`)) {
      event.preventDefault();
      completeDesktopOAuth(url);
    }
  });

  loadApp(win);

  if (openDevTools) win.webContents.openDevTools({ mode: "detach" });
  return win;
}

registerProtocol();

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const oauthUrl = parseProtocolArg(argv);
    if (oauthUrl) completeDesktopOAuth(oauthUrl);
    const win = mainWindow ?? BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

app.on("open-url", (event, url) => {
  event.preventDefault();
  completeDesktopOAuth(url);
});

ipcMain.handle("google-sign-in", () => openGoogleOAuthWindow());

/** file:// UI cannot send cookies to https API — use the shared session partition. */
ipcMain.handle("remio-session-fetch", async (_event, { path, method = "GET", body }) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = p.startsWith("http") ? p : `${API_ORIGIN}/api${p}`;
  const ses = session.fromPartition(SESSION_PARTITION);
  const hasBody = body !== undefined && body !== null;
  const payload = hasBody ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined;
  const res = await ses.fetch(url, {
    method,
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: payload,
    credentials: "include",
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, statusText: res.statusText, data, ok: res.ok };
});

app.whenReady().then(() => {
  const ses = session.fromPartition(SESSION_PARTITION);
  ses.setUserAgent(`${ses.getUserAgent()} RemioDesktop/0.1.0`);

  const oauthUrl = parseProtocolArg(process.argv);
  createWindow();
  if (oauthUrl) completeDesktopOAuth(oauthUrl);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
