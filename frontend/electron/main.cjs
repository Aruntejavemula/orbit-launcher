const { app, BrowserWindow, shell, session, ipcMain } = require("electron");
const path = require("path");
const { APP_URL } = require("./config.cjs");

const isPackaged = app.isPackaged;
const openDevTools =
  !isPackaged &&
  (process.env.REMIO_ELECTRON_DEBUG === "1" || process.argv.includes("--devtools"));

const SESSION_PARTITION = "persist:remio";
const PROTOCOL = "remio";

let mainWindow = null;

function isGoogleOAuthStartUrl(url) {
  try {
    const { pathname } = new URL(url);
    const path = pathname.replace(/\/$/, "");
    return path === "/api/auth/google" || path.endsWith("/auth/google");
  } catch {
    return false;
  }
}

function openGoogleOAuthInBrowser(url, { desktop = true } = {}) {
  const target = new URL(url);
  if (desktop) target.searchParams.set("desktop", "1");
  return shell.openExternal(target.toString());
}

/** Remio site stays in the window; everything else (incl. Google) uses the system browser. */
function navigationTarget(url) {
  try {
    const { hostname } = new URL(url);
    if (hostname === "remiolauncher.com" || hostname.endsWith(".remiolauncher.com")) {
      return "in-app";
    }
    return "external";
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
    openGoogleOAuthInBrowser(url);
    return;
  }
  if (navigationTarget(url) === "external") {
    event.preventDefault();
    shell.openExternal(url);
  }
}

function registerProtocol() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

function parseProtocolArg(argv) {
  return argv.find((arg) => typeof arg === "string" && arg.startsWith(`${PROTOCOL}://`));
}

async function completeDesktopOAuth(rawUrl) {
  const win = mainWindow ?? BrowserWindow.getAllWindows()[0];
  if (!win) return;

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    win.loadURL(`${APP_URL}/?google_error=1`);
    return;
  }

  const err = parsed.searchParams.get("error");
  const code = parsed.searchParams.get("code");
  if (err || !code) {
    win.loadURL(`${APP_URL}/?google_error=1`);
    win.focus();
    return;
  }

  const ses = session.fromPartition(SESSION_PARTITION);
  try {
    const res = await ses.fetch(`${APP_URL}/api/auth/desktop/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      win.loadURL(`${APP_URL}/?google_error=1`);
      win.focus();
      return;
    }
    win.loadURL(APP_URL);
    win.focus();
  } catch (e) {
    console.error("[Remio] desktop OAuth session failed:", e);
    win.loadURL(`${APP_URL}/?google_error=1`);
    win.focus();
  }
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

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (navigationTarget(url) === "external") {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", handleWebContentsNavigation);
  // will-redirect only for remio:// deep-link returns; don't interfere with live-site redirects.
  win.webContents.on("will-redirect", (event, url) => {
    if (url.startsWith(`${PROTOCOL}://`)) {
      event.preventDefault();
      completeDesktopOAuth(url);
    }
  });

  const appOrigin = new URL(APP_URL).origin;
  win.webContents.on("did-fail-load", (_event, code, description, validatedURL) => {
    if (validatedURL === APP_URL || validatedURL.startsWith(appOrigin)) {
      console.error("[Remio] failed to load:", code, description);
    }
  });

  win.loadURL(APP_URL);

  if (openDevTools) {
    win.webContents.openDevTools({ mode: "detach" });
  }

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

ipcMain.handle("google-sign-in", async () => {
  const url = `${APP_URL}/api/auth/google?desktop=1`;
  const err = await shell.openExternal(url);
  if (err) console.error("[Remio] openExternal failed:", err);
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
