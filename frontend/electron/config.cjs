const path = require("path");

/** Public app origin only — no secrets. */
const APP_URL = process.env.REMIO_APP_URL || "http://localhost:5173";

module.exports = {
  APP_URL,
  API_ORIGIN: APP_URL.replace(/\/$/, ""),
  DIST_INDEX: path.join(__dirname, "..", "dist", "index.html"),
};
