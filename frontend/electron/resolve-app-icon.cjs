const fs = require("fs");
const path = require("path");

/** Windows .ico for taskbar/exe; fallback to 512 PNG before icons:generate runs. */
function resolveAppIcon(rootDir) {
  const ico = path.join(rootDir, "build", "icon.ico");
  const png = path.join(rootDir, "public", "icon-512x512.png");
  return fs.existsSync(ico) ? ico : png;
}

/** 512×512 PNG for electron-builder mac/linux (and default icon when .ico is too small). */
function resolveAppIcon512(rootDir) {
  const buildPng = path.join(rootDir, "build", "icon.png");
  const publicPng = path.join(rootDir, "public", "icon-512x512.png");
  if (fs.existsSync(buildPng)) return buildPng;
  if (fs.existsSync(publicPng)) return publicPng;
  return resolveAppIcon(rootDir);
}

module.exports = { resolveAppIcon, resolveAppIcon512 };
