const fs = require("fs");
const path = require("path");
const { build } = require("./package.json");

const appxFile = path.join(__dirname, "electron", "store.appx.json");
const appx = JSON.parse(
  fs.readFileSync(fs.existsSync(appxFile) ? appxFile : path.join(__dirname, "electron", "store.appx.example.json"), "utf8")
);

const appIcon = path.join(__dirname, "public", "icon-512x512.png");

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
    publish: null,
  },
  mac: undefined,
  linux: undefined,
};
