import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { toast } from "./components/Toast";
import { getApiBase } from "./lib/apiOrigin";
import { API_HTML_RESPONSE, assertJsonApiResponse } from "./lib/apiJsonResponse";
import { isCapacitorNative } from "./lib/capacitor";
import { getCapacitorAccessToken } from "./lib/capacitorSession";
import { getRemioDesktop, isRemioDesktop } from "./lib/desktop";
import { appPathname, isPackagedFile, navigateAppRoot } from "./lib/navigation";

const apiBase = getApiBase();

// Public bundle: only VITE_* env vars are embedded. Secrets and DB config live in backend/.env only.
const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  timeout: 10000,
  headers: { Accept: "application/json" },
});

const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/me", "/auth/remember-device"];

if (isCapacitorNative()) {
  if (!apiBase.startsWith("http")) {
    console.error(
      "[Remio] Capacitor build has relative API base (%s). Run: npm run cap:build",
      apiBase,
    );
  }
  api.interceptors.request.use((config) => {
    if (!apiBase.startsWith("http")) {
      return Promise.reject(
        new Error(
          "API base URL is not configured for mobile. Rebuild the app with npm run cap:build.",
        ),
      );
    }
    const token = getCapacitorAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

function apiPath(config: InternalAxiosRequestConfig): string {
  const base = (config.baseURL || "").replace(/\/$/, "");
  let path = config.url || "";
  if (base && path.startsWith(base)) path = path.slice(base.length);
  if (!path.startsWith("/")) path = `/${path}`;
  return path;
}

const desktop = getRemioDesktop();
if (isRemioDesktop() && desktop?.sessionFetch) {
  const sessionFetch = desktop.sessionFetch;
  api.defaults.adapter = async (config) => {
    const path = apiPath(config);
    let body: unknown = config.data;
    if (body !== undefined && body !== null && typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        /* already a raw string payload */
      }
    }
    const result = await sessionFetch(path, {
      method: (config.method || "get").toUpperCase(),
      body,
    });
    const response = {
      data: result.data,
      status: result.status,
      statusText: result.statusText || "",
      headers: {},
      config,
      request: {},
    };
    if (!result.ok) {
      throw new axios.AxiosError(
        "Request failed",
        axios.AxiosError.ERR_BAD_RESPONSE,
        config,
        response.request,
        response
      );
    }
    return response;
  };
}

api.interceptors.response.use(
  (r: AxiosResponse) => {
    assertJsonApiResponse(r);
    return r;
  },
  (err) => {
    if (axios.isCancel(err)) return Promise.reject(err);
    const url: string = err.config?.url ?? "";
    const isAuthCall = AUTH_ENDPOINTS.some((p) => url.includes(p));
    if (err.name === API_HTML_RESPONSE || (err instanceof Error && err.message.includes("HTML instead of JSON"))) {
      if (!isAuthCall) {
        toast(
          "App is calling the wrong server (got a web page, not API data). Rebuild with npm run cap:build.",
          "error",
        );
      }
      return Promise.reject(err);
    }
    if (err.response?.status === 401) {
      if (!isAuthCall && appPathname() !== "/") {
        // Capacitor/file: avoid location.href — full reload drops state and can re-show onboarding.
        if (isPackagedFile() || isCapacitorNative()) {
          navigateAppRoot();
        } else {
          window.location.href = "/";
        }
      }
    } else if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      if (!isAuthCall) {
        toast("Server took too long to respond. Please try again.", "error");
      }
    } else if (!err.response && !isAuthCall) {
      toast("Cannot reach the server. Check your connection.", "error");
    }
    return Promise.reject(err);
  }
);

export default api;
