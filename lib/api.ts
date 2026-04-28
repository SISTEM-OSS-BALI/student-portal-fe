import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.withCredentials = true;

  if (config.url && config.url.startsWith("http")) {
    return config;
  }

  if (config.url && !config.url.startsWith("/")) {
    config.url = `/${config.url}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      const url = String(error.config?.url ?? "");

      const isAuthEndpoint =
        url.includes("/api/auth/login") ||
        url.includes("/api/auth/register") ||
        url.includes("/api/auth/me") ||
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/me");

      const isAuthPage =
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/forgot-password");

      if (!isAuthEndpoint && !isAuthPage) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
