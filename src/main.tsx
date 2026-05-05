import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { AppsProvider } from "./context/AppsContext";
import { PreferencesProvider } from "./context/PreferencesContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PreferencesProvider>
      <AuthProvider>
        <AppsProvider>
          <App />
        </AppsProvider>
      </AuthProvider>
    </PreferencesProvider>
  </React.StrictMode>
);
