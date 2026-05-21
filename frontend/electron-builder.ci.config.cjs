const fs = require("fs");
const path = require("path");

const { loadAppxBuildOptions } = require("./electron/load-appx.cjs");
const appx = loadAppxBuildOptions();

const { resolveAppIcon, resolveAppIcon512 } = require("./electron/resolve-app-icon.cjs");
const winIcon = resolveAppIcon(__dirname);
const appIcon512 = resolveAppIcon512(__dirname);
const storeHelperExe = path.join(__dirname, "electron", "store-update", "bin", "Remio.StoreUpdate.exe");
const storeUpdateResources = fs.existsSync(storeHelperExe)
  ? [{ from: "electron/store-update/bin", to: "store-update", filter: ["Remio.StoreUpdate.exe"] }]
  : [];

/** CI artifacts — one platform per runner (win / mac / linux). */
module.exports = {
  appId: "com.remiolauncher.app",
  productName: "Remio",
  icon: appIcon512,
  directories: { output: "release-ci" },
  files: ["dist/**/*", "electron/**/*", "package.json"],
  extraMetadata: { main: "electron/main.cjs" },
  forceCodeSigning: false,
  win: {
    target: [{ target: "appx", arch: ["x64"] }],
    icon: winIcon,
    signAndEditExecutable: true,
    signDlls: false,
    verifyUpdateCodeSignature: false,
  },
  appx: { ...appx, publish: null },
  extraResources: storeUpdateResources,
  mac: {
    target: [{ target: "dmg", arch: ["universal"] }],
    icon: appIcon512,
    identity: null,
    gatekeeperAssess: false,
    hardenedRuntime: false,
  },
  linux: {
    target: [{ target: "AppImage", arch: ["x64"] }],
    icon: appIcon512,
    category: "Utility",
  },
};
