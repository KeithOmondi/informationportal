import axios, { type AxiosRequestConfig } from "axios";
import { savePendingRequest } from "../lib/syncDB"; // 👈 added

interface FailedRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  originalRequest: AxiosRequestConfig;
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

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(api.request(prom.originalRequest));
  });
  failedQueue = [];
};

// 👇 helper to register background sync
const registerBackgroundSync = async () => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready
    await reg.sync.register('sync-pending-requests')
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 👇 No response = offline — save POST/PUT requests for background sync
    if (!error.response) {
      const method = originalRequest.method?.toUpperCase()
      if (method === 'POST' || method === 'PUT') {
        await savePendingRequest({
          url: `${import.meta.env.VITE_API_URL}${originalRequest.url}`,
          method,
          body: typeof originalRequest.data === 'string'
            ? originalRequest.data
            : JSON.stringify(originalRequest.data ?? {}),
          headers: (originalRequest.headers as Record<string, string>) ?? {}
        })
        await registerBackgroundSync()
      }
      return Promise.reject(error)
    }

    const status = error.response.status;
    const errorMessage = error.response?.data?.message || "";
    const isAuthPath = originalRequest.url?.includes("/auth/");

    /* --- 1. THE SECURITY KICKOUT --- */
    if (status === 401 && errorMessage.toLowerCase().includes("another device")) {
      isRefreshing = false;
      failedQueue = [];
      logoutHandler("Security Alert: Account accessed from another device.");
      return Promise.reject(error);
    }

    /* --- 2. THE REFRESH LOGIC --- */
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
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true });
        isRefreshing = false;
        processQueue(null);
        return api.request(originalRequest);
      } catch (refreshErr: any) {
        isRefreshing = false;
        processQueue(refreshErr);
        logoutHandler();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);