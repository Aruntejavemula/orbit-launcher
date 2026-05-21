const path = require("path");

const appIcon = path.join(__dirname, "public", "icon-512x512.png");

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
    signAndEditExecutable: true,
    signDlls: false,
    verifyUpdateCodeSignature: false,
  },
};
