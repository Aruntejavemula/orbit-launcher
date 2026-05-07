import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        registerType: "autoUpdate",
        manifest: false,
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,jpeg,png,svg,woff2}"],
        },
      }),
    ],
    server: {
      port: 5173,
      open: true,
      proxy: {
        "/api": {
          target: env.BACKEND_URL ?? "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
