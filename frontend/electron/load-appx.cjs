const fs = require("fs");
const path = require("path");

/** Partner Center identity for electron-builder (AppX manifest). */
function loadAppxBuildOptions() {
  const appxFile = path.join(__dirname, "store.appx.json");
  const fallback = path.join(__dirname, "store.appx.example.json");
  const raw = JSON.parse(fs.readFileSync(fs.existsSync(appxFile) ? appxFile : fallback, "utf8"));
  const { partnerCenter: _partnerCenter, ...appxBuild } = raw;
  return appxBuild;
}

module.exports = { loadAppxBuildOptions };
