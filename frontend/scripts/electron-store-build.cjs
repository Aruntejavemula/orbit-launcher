const { execSync } = require("child_process");
const path = require("path");

const out = `release-msix-${Date.now()}`;
const root = path.join(__dirname, "..");
const env = {
  ...process.env,
  REMIO_ENV: "production",
  CSC_IDENTITY_AUTO_DISCOVERY: "false",
  WIN_CSC_LINK: "",
  WIN_CSC_KEY_PASSWORD: "",
};

console.log(`Building MSIX to ${out}/ (do not run Remio.exe from this folder until the build finishes)`);
console.log("If winCodeSign fails: run PowerShell as Administrator, enable Developer Mode, then retry.");

const helperProj = path.join(root, "electron", "store-update", "Remio.StoreUpdate.csproj");
const helperOut = path.join(root, "electron", "store-update", "bin");
console.log("Building Microsoft Store update helper (Remio.StoreUpdate.exe)...");
execSync(
  `dotnet publish "${helperProj}" -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o "${helperOut}"`,
  { cwd: root, stdio: "inherit", env }
);

execSync("npm run icons:generate", { cwd: root, stdio: "inherit", env });
execSync("npm run electron:build:ui", { cwd: root, stdio: "inherit", env });
execSync(
  `npx electron-builder --config electron-builder.config.cjs --publish never --config.directories.output=${out}`,
  { cwd: root, stdio: "inherit", env }
);

console.log(`\nDone. Look for .appx in: ${path.join(root, out)}`);
