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

async function writePng(size, filename, dir, source) {
  const buf = await pngBuffer(size, source);
  const out = path.join(dir, filename);
  fs.writeFileSync(out, buf);
  console.log("wrote", out);
  return buf;
}

const source = resolveSource();
console.log("icon source:", source);

fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(storeAssetsDir, { recursive: true });

const pwaSizes = [16, 24, 32, 48, 64, 128, 192, 256, 512];
for (const size of pwaSizes) {
  await writePng(size, `icon-${size}x${size}.png`, publicDir, source);
}

await writePng(180, "apple-touch-icon.png", publicDir, source);
fs.copyFileSync(path.join(publicDir, "icon-512x512.png"), path.join(publicDir, "icon.png"));

/** Windows ICO for taskbar / exe / electron-builder (16–256). */
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoBuffers = await Promise.all(icoSizes.map((s) => pngBuffer(s, source)));
const icoPath = path.join(buildDir, "icon.ico");
fs.writeFileSync(icoPath, await toIco(icoBuffers));
console.log("wrote", icoPath);

/** Partner Center / MSIX reference tiles (electron-builder also derives from build.icon). */
const storeTiles = [
  [44, "Square44x44Logo.png"],
  [50, "Square50x50Logo.png"],
  [150, "Square150x150Logo.png"],
  [310, "Square310x310Logo.png"],
  [300, "StoreLogo300x300.png"],
];
for (const [size, name] of storeTiles) {
  await writePng(size, name, storeAssetsDir, source);
}

console.log("Done. Remio mark only — do not substitute Electron default icons.");
