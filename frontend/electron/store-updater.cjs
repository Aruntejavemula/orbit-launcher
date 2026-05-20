/**
 * Microsoft Store package updates via Windows.Services.Store (StoreContext).
 * Do not use electron-updater with a custom feed for Store builds — Partner Center
 * delivers updates through the Store; this helper triggers the official install flow.
 */
const { app } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const CHECK_DELAY_MS = 12_000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

function isMicrosoftStoreInstall() {
  if (process.platform !== "win32") return false;
  if (process.windowsStore === true) return true;
  const pfn = process.env.APPX_PACKAGE_FAMILY_NAME || process.env.PackageFamilyName;
  if (pfn && String(pfn).length > 0) return true;
  return /\\WindowsApps\\/i.test(process.execPath || "");
}

function helperPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "store-update", "Remio.StoreUpdate.exe");
  }
  return path.join(__dirname, "store-update", "bin", "Remio.StoreUpdate.exe");
}

function hwndArg(nativeHandle) {
  if (!nativeHandle || nativeHandle.length < 8) return "0";
  try {
    return nativeHandle.readBigInt64LE(0).toString();
  } catch {
    return "0";
  }
}

function runStoreUpdateCheck(nativeHandle) {
  const exe = helperPath();
  if (!fs.existsSync(exe)) {
    return Promise.resolve({
      ok: false,
      status: "skipped",
      message: "Store update helper not built (run electron:build:store on Windows with .NET SDK).",
    });
  }

  return new Promise((resolve) => {
    const args = ["--hwnd", hwndArg(nativeHandle)];
    const child = spawn(exe, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (err) => {
      resolve({ ok: false, status: "error", message: err.message });
    });
    child.on("close", () => {
      const line = (stdout || stderr).trim().split(/\r?\n/).pop() || "";
      try {
        resolve(JSON.parse(line));
      } catch {
        resolve({ ok: false, status: "error", message: line || "Invalid helper output" });
      }
    });
  });
}

async function checkForStoreUpdates(browserWindow) {
  if (!isMicrosoftStoreInstall()) {
    return { ok: true, status: "not-store", message: "Updates apply to Microsoft Store installs only." };
  }

  const handle =
    browserWindow && !browserWindow.isDestroyed()
      ? browserWindow.getNativeWindowHandle()
      : null;
  const result = await runStoreUpdateCheck(handle);
  if (result.status === "install-started") {
    console.info("[Remio] Microsoft Store update install started", result);
  } else if (result.status === "up-to-date") {
    console.info("[Remio] Microsoft Store app is up to date");
  } else if (result.status === "error") {
    console.warn("[Remio] Store update check failed:", result.message);
  }
  return result;
}

function scheduleStoreUpdateChecks(getMainWindow) {
  if (!app.isPackaged || !isMicrosoftStoreInstall()) return;

  const run = () => {
    const win = typeof getMainWindow === "function" ? getMainWindow() : getMainWindow;
    void checkForStoreUpdates(win);
  };

  setTimeout(run, CHECK_DELAY_MS);
  setInterval(run, CHECK_INTERVAL_MS);
}

module.exports = {
  isMicrosoftStoreInstall,
  checkForStoreUpdates,
  scheduleStoreUpdateChecks,
};
