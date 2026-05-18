import axios, { type InternalAxiosRequestConfig } from "axios";
import { toast } from "./components/Toast";
import { appPathname, isPackagedFile, navigateAppRoot } from "./lib/navigation";

// Public bundle: only VITE_* env vars are embedded. Secrets and DB config live in backend/.env only.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true,
  timeout: 10000,
});

const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/me", "/auth/remember-device"];

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
  (r) => r,
  (err) => {
    if (axios.isCancel(err)) return Promise.reject(err);
    const url: string = err.config?.url ?? "";
    const isAuthCall = AUTH_ENDPOINTS.some((p) => url.includes(p));
    if (err.response?.status === 401) {
      if (!isAuthCall && appPathname() !== "/") {
        if (isPackagedFile()) {
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
