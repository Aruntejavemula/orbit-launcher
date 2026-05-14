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
          globPatterns: ["**/*.{js,css,html,ico,woff2}"],
          maximumFileSizeToCacheInBytes: 200_000,
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "vendor";
            if (id.includes("node_modules/framer-motion/")) return "motion";
            if (id.includes("node_modules/@tanstack/react-query/")) return "query";
            if (id.includes("node_modules/lucide-react/")) return "icons";
          },
        },
      },
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        "/api": {
          target: env.BACKEND_URL ?? "https://orbit-launcher-production.up.railway.app",
          changeOrigin: true,
        },
      },
    },
  };
});
