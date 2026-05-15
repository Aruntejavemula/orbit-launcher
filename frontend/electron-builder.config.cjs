const fs = require("fs");
const path = require("path");
const { build } = require("./package.json");

const appxFile = path.join(__dirname, "electron", "store.appx.json");
const appx = JSON.parse(
  fs.readFileSync(fs.existsSync(appxFile) ? appxFile : path.join(__dirname, "electron", "store.appx.example.json"), "utf8")
);

/** Microsoft Store MSIX — signing happens in Partner Center, not locally. */
module.exports = {
  ...build,
  win: {
    target: [{ target: "appx", arch: ["x64"] }],
    signAndEditExecutable: false,
  },
  appx,
  mac: undefined,
  linux: undefined,
};
