const path = require("path");
const { app } = require("electron");

/** Public origins only — no secrets. */
const packaged = app.isPackaged;
const APP_URL = (
  process.env.REMIO_APP_URL ||
  (packaged || process.env.REMIO_ENV === "production"
    ? "https://www.remiolauncher.com"
    : "http://localhost:5173")
).replace(/\/$/, "");

module.exports = {
  APP_URL,
  API_ORIGIN: APP_URL,
  /** Bundled UI inside app.asar — do not check with fs.existsSync */
  PACKAGED_INDEX: path.join(__dirname, "..", "dist", "index.html"),
};
