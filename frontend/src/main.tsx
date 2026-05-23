import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { queryClient } from "./queryClient";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { isCapacitorNative } from "./lib/capacitor";
import { initNativePushListeners } from "./lib/capacitorPush";

async function bootstrap() {
  if (isCapacitorNative()) {
    initNativePushListeners();
  }

  const webOnly = import.meta.env.MODE !== "electron" && import.meta.env.MODE !== "capacitor";
  if (webOnly) {
    void import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({ immediate: true });
    });
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

void bootstrap();
