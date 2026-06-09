/**
 * Build Remio install icons from our proprietary mark (public/app-hero-icon.jpeg).
 * Outputs PWA, favicon, Windows .ico, and Store tile PNGs — no default Electron icons.
 * Run: npm run icons:generate
 */
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import toIco from "to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const buildDir = path.join(__dirname, "..", "build");
const storeAssetsDir = path.join(buildDir, "store-assets");
const appxAssetsDir = path.join(buildDir, "appx");

const SOURCE_CANDIDATES = ["app-hero-icon.jpeg", "icon-512x512.png", "app-hero-icon.svg"];

function resolveSource() {
  for (const name of SOURCE_CANDIDATES) {
    const p = path.join(publicDir, name);
    if (fs.existsSync(p)) return p;
  }
  console.error("No icon source found. Add public/app-hero-icon.jpeg (preferred).");
  process.exit(1);
}

async function pngBuffer(size, source) {
  const img = await loadImage(source);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, size, size);
  return canvas.toBuffer("image/png");
}

/** MSIX wide tile: 310×150 (cover crop, centered). */
async function widePngBuffer(width, height, source) {
  const img = await loadImage(source);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const scale = Math.max(width / img.width, height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (width - w) / 2;
  const y = (height - h) / 2;
  ctx.drawImage(img, x, y, w, h);
  return canvas.toBuffer("image/png");
}

async function writePng(size, filename, dir, source) {
  const buf = await pngBuffer(size, source);
  const out = path.join(dir, filename);
  fs.writeFileSync(out, buf);
  console.log("wrote", out);
  return buf;
}

async function writeWidePng(filename, dir, source) {
  const buf = await widePngBuffer(310, 150, source);
  const out = path.join(dir, filename);
  fs.writeFileSync(out, buf);
  console.log("wrote", out);
}

/** Promo / screenshot slots: logo centered on black, aspect-fit (no crop). */
async function fitContainPngBuffer(width, height, source) {
  const img = await loadImage(source);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  const scale = Math.min(width / img.width, height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (width - w) / 2;
  const y = (height - h) / 2;
  ctx.drawImage(img, x, y, w, h);
  return canvas.toBuffer("image/png");
}

async function writeFitPng(width, height, filename, dir, source) {
  const buf = await fitContainPngBuffer(width, height, source);
  const out = path.join(dir, filename);
  fs.writeFileSync(out, buf);
  console.log("wrote", out);
}

const source = resolveSource();
console.log("icon source:", source);

fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(storeAssetsDir, { recursive: true });
fs.mkdirSync(appxAssetsDir, { recursive: true });

const pwaSizes = [16, 24, 32, 48, 64, 128, 192, 256, 512];
for (const size of pwaSizes) {
  await writePng(size, `icon-${size}x${size}.png`, publicDir, source);
}

await writePng(180, "apple-touch-icon.png", publicDir, source);
fs.copyFileSync(path.join(publicDir, "icon-512x512.png"), path.join(publicDir, "icon.png"));

/** Windows ICO (16–256). mac/linux use build/icon.png (512) — to-ico does not embed 512. */
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoBuffers = await Promise.all(icoSizes.map((s) => pngBuffer(s, source)));
const icoPath = path.join(buildDir, "icon.ico");
fs.writeFileSync(icoPath, await toIco(icoBuffers));
console.log("wrote", icoPath);

const icon512Path = path.join(buildDir, "icon.png");
fs.writeFileSync(icon512Path, await pngBuffer(512, source));
console.log("wrote", icon512Path);

/** Partner Center / Store listing logos (square PNG). */
const storeTiles = [
  [71, "StoreLogo71x71.png"],
  [150, "StoreLogo150x150.png"],
  [300, "StoreLogo300x300.png"],
  [44, "Square44x44Logo.png"],
  [50, "Square50x50Logo.png"],
  [150, "Square150x150Logo.png"],
  [310, "Square310x310Logo.png"],
];
for (const [size, name] of storeTiles) {
  await writePng(size, name, storeAssetsDir, source);
}

/** Partner Center large promotional images (PNG). */
await writeFitPng(1440, 2160, "StorePromo1440x2160.png", storeAssetsDir, source);
await writePng(2160, "StorePromo2160x2160.png", storeAssetsDir, source);

/** Google Play feature graphic: 1024×500, icon left + "Remio" title + tagline. */
async function featureGraphicBuffer(source) {
  const W = 1024, H = 500;
  const img = await loadImage(source);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  const iconSize = 180;
  const iconX = (W - iconSize) / 2;
  const iconY = 80;
  const radius = 36;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(iconX + radius, iconY);
  ctx.arcTo(iconX + iconSize, iconY, iconX + iconSize, iconY + iconSize, radius);
  ctx.arcTo(iconX + iconSize, iconY + iconSize, iconX, iconY + iconSize, radius);
  ctx.arcTo(iconX, iconY + iconSize, iconX, iconY, radius);
  ctx.arcTo(iconX, iconY, iconX + iconSize, iconY, radius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Remio", W / 2, 320);

  ctx.fillStyle = "#888888";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText("Track subscriptions. Stay in control.", W / 2, 365);

  return canvas.toBuffer("image/png");
}
const fgBuf = await featureGraphicBuffer(source);
const fgPath = path.join(storeAssetsDir, "PlayFeatureGraphic1024x500.png");
fs.writeFileSync(fgPath, fgBuf);
console.log("wrote", fgPath);

/** electron-builder MSIX manifest assets (build/appx — exact names and pixel sizes). */
const appxTiles = [
  [44, "Square44x44Logo.png"],
  [50, "StoreLogo.png"],
  [150, "Square150x150Logo.png"],
  [310, "LargeTile.png"],
];
for (const [size, name] of appxTiles) {
  await writePng(size, name, appxAssetsDir, source);
}
await writeWidePng("Wide310x150Logo.png", appxAssetsDir, source);

console.log("Done. Remio mark only — do not substitute Electron default icons.");
