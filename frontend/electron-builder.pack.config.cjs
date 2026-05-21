const path = require("path");

const { resolveAppIcon } = require("./electron/resolve-app-icon.cjs");
const appIcon = resolveAppIcon(__dirname);

/** Local dev — unsigned folder at release/win-unpacked/Remio.exe */
module.exports = {
  appId: "com.remiolauncher.app",
  productName: "Remio",
  icon: appIcon,
  directories: { output: "release" },
  files: ["dist/**/*", "electron/**/*", "package.json"],
  extraMetadata: { main: "electron/main.cjs" },
  forceCodeSigning: false,
  win: {
    target: [{ target: "dir", arch: ["x64"] }],
    icon: appIcon,
    signAndEditExecutable: false,
    signDlls: false,
    verifyUpdateCodeSignature: false,
  },
};
