const fs = require("fs");
const path = require("path");

/** Windows .ico for taskbar/exe; fallback to 512 PNG before icons:generate runs. */
function resolveAppIcon(rootDir) {
  const ico = path.join(rootDir, "build", "icon.ico");
  const png = path.join(rootDir, "public", "icon-512x512.png");
  return fs.existsSync(ico) ? ico : png;
}

module.exports = { resolveAppIcon };
