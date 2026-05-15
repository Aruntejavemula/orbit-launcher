import axios from "axios";
import { toast } from "./components/Toast";

// Public bundle: only VITE_* env vars are embedded. Secrets and DB config live in backend/.env only.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true,
  timeout: 10000,
});

const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/me"];

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (axios.isCancel(err)) return Promise.reject(err);
    const url: string = err.config?.url ?? "";
    const isAuthCall = AUTH_ENDPOINTS.some((p) => url.includes(p));
    if (err.response?.status === 401) {
      if (!isAuthCall && window.location.pathname !== "/") {
        window.location.href = "/";
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
