const fs = require("fs");
const path = require("path");

const appxFile = path.join(__dirname, "electron", "store.appx.json");
const appx = JSON.parse(
  fs.readFileSync(
    fs.existsSync(appxFile) ? appxFile : path.join(__dirname, "electron", "store.appx.example.json"),
    "utf8"
  )
);

const appIcon = path.join(__dirname, "public", "icon-512x512.png");

/** CI artifacts — one platform per runner (win / mac / linux). */
module.exports = {
  appId: "com.remiolauncher.app",
  productName: "Remio",
  icon: appIcon,
  directories: { output: "release-ci" },
  files: ["dist/**/*", "electron/**/*", "package.json"],
  extraMetadata: { main: "electron/main.cjs" },
  forceCodeSigning: false,
  win: {
    target: [{ target: "appx", arch: ["x64"] }],
    icon: appIcon,
    signAndEditExecutable: true,
    signDlls: false,
    verifyUpdateCodeSignature: false,
  },
  appx: { ...appx, publish: null },
  mac: {
    target: [{ target: "dmg", arch: ["universal"] }],
    identity: null,
    gatekeeperAssess: false,
    hardenedRuntime: false,
  },
  linux: {
    target: [{ target: "AppImage", arch: ["x64"] }],
    category: "Utility",
  },
};
