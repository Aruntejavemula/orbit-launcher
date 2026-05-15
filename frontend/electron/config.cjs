const path = require("path");

/** Public origins only — no secrets. */
const APP_URL =
  process.env.REMIO_APP_URL ||
  (process.env.REMIO_ENV === "production"
    ? "https://www.remiolauncher.com"
    : "http://localhost:5173");

module.exports = {
  APP_URL,
  API_ORIGIN: APP_URL.replace(/\/$/, ""),
  DIST_INDEX: path.join(__dirname, "..", "dist", "index.html"),
};
