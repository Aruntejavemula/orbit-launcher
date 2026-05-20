const fs = require("fs");
const path = require("path");
const { build } = require("./package.json");

const { loadAppxBuildOptions } = require("./electron/load-appx.cjs");
const appx = loadAppxBuildOptions();

const { resolveAppIcon } = require("./electron/resolve-app-icon.cjs");
const appIcon = resolveAppIcon(__dirname);
const storeHelperExe = path.join(__dirname, "electron", "store-update", "bin", "Remio.StoreUpdate.exe");
const storeUpdateResources = fs.existsSync(storeHelperExe)
  ? [{ from: "electron/store-update/bin", to: "store-update", filter: ["Remio.StoreUpdate.exe"] }]
  : [];

/** Microsoft Store MSIX — signing happens in Partner Center, not locally. */
module.exports = {
  ...build,
  icon: appIcon,
  forceCodeSigning: false,
  win: {
    target: [{ target: "appx", arch: ["x64"] }],
    icon: appIcon,
    signAndEditExecutable: true,
    signDlls: false,
    verifyUpdateCodeSignature: false,
  },
  appx: {
    ...appx,
    displayName: "Remio",
    publish: null,
  },
  extraResources: storeUpdateResources,
  mac: undefined,
  linux: undefined,
};
