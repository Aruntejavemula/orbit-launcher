import axios from "axios";
import { toast } from "./components/Toast";

export const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

// In Tauri desktop mode, call the Railway backend directly (cookies don't work cross-origin).
// In web mode, use the relative /api path (Vercel proxy handles it).
const PRODUCTION_BACKEND = "https://orbit-launcher-production.up.railway.app/api";
export const API_BASE_URL = import.meta.env.VITE_API_URL
  ?? (isTauri ? PRODUCTION_BACKEND : "/api");

const TOKEN_KEY = "remio_auth_token";

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: !isTauri,
  timeout: 10000,
});

// In Tauri mode, attach Bearer token from localStorage instead of relying on cookies
if (isTauri) {
  api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/me"];

api.interceptors.response.use(
  (r) => {
    // Store token from login/register responses in Tauri mode
    if (isTauri && r.data?.token) {
      setAuthToken(r.data.token);
    }
    return r;
  },
  (err) => {
    if (axios.isCancel(err)) return Promise.reject(err);
    if (err.response?.status === 401) {
      const url: string = err.config?.url ?? "";
      const isAuthCall = AUTH_ENDPOINTS.some((p) => url.includes(p));
      if (!isAuthCall && window.location.pathname !== "/") {
        if (isTauri) clearAuthToken();
        window.location.href = "/";
      }
    }
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      toast("Server took too long to respond. Please try again.", "error");
    } else if (!err.response) {
      toast("Cannot reach the server. Check your connection.", "error");
    }
    return Promise.reject(err);
  }
);

export default api;
