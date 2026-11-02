import axios, { type AxiosRequestConfig, type AxiosResponse, AxiosError } from "axios";
import { savePendingRequest } from "../lib/syncDB";
import { getStore } from "../store/storeAccessor";

// Define the shape of the error response from your API
interface ApiErrorResponse {
  message?: string;
}

interface FailedRequest {
  resolve: (value: AxiosResponse | Promise<AxiosResponse>) => void;
  reject: (reason: unknown) => void;
  originalRequest: AxiosRequestConfig & { _retry?: boolean };
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 60000,
});

let logoutHandler: (reason?: string) => void = () => {};
export const injectLogout = (handler: (reason?: string) => void) => {
  logoutHandler = handler;
};

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

/* ===========================
    FIX: no-unused-expressions
   =========================== */
const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(api.request(prom.originalRequest));
    }
  });
  failedQueue = [];
};

/* ===========================
    FIX: ban-ts-comment
   =========================== */
const registerBackgroundSync = async () => {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register("sync-pending-requests");
  }
};

api.interceptors.request.use((config) => {
  const token = getStore()?.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      const method = originalRequest.method?.toUpperCase();
      if (method === "POST" || method === "PUT") {
        await savePendingRequest({
          url: `${import.meta.env.VITE_API_URL}${originalRequest.url}`,
          method,
          body:
            typeof originalRequest.data === "string"
              ? originalRequest.data
              : JSON.stringify(originalRequest.data ?? {}),
          headers: (originalRequest.headers as Record<string, string>) ?? {},
        });
        await registerBackgroundSync();
      }
      return Promise.reject(error);
    }

    const status = error.response.status;
    const errorMessage = error.response?.data?.message || "";
    const isAuthPath = originalRequest.url?.includes("/auth/");

    if (status === 401 && errorMessage.toLowerCase().includes("another device")) {
      isRefreshing = false;
      failedQueue = [];
      logoutHandler("Security Alert: Account accessed from another device.");
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      if (isAuthPath) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post<{ accessToken: string }>(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshRes.data.accessToken;
        if (newToken) {
          getStore()?.dispatch({
            type: "auth/setAccessToken",
            payload: newToken,
          });
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
        }

        isRefreshing = false;
        processQueue(null);
        return api.request(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(refreshErr);

        if (axios.isAxiosError(refreshErr)) {
          const refreshData = refreshErr.response?.data as ApiErrorResponse | undefined;
          const msg = refreshData?.message || "";
          if (msg.toLowerCase().includes("another device")) {
            logoutHandler("Security Alert: Account accessed from another device.");
          } else {
            logoutHandler();
          }
        } else {
          logoutHandler();
        }

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);