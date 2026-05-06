import axios from "axios";
import { toast } from "./components/Toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (axios.isCancel(err)) return Promise.reject(err);
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      toast("Server took too long to respond. Please try again.", "error");
    } else if (!err.response) {
      toast("Cannot reach the server. Check your connection.", "error");
    }
    return Promise.reject(err);
  }
);

export default api;
