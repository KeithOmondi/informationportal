import axios, { type AxiosRequestConfig } from "axios";

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!error.response) return Promise.reject(error);

    const status = error.response.status;
    const errorMessage = error.response?.data?.message || "";
    
    // Check if the failed request was an AUTH endpoint
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
      // CRITICAL: If the 401 came from LOGIN or REFRESH, don't intercept.
      // This stops the "Instant Logout" on a fresh login.
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
        // Use standard axios for the refresh call to avoid interceptor recursion
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        isRefreshing = false;
        processQueue(null);
        return api.request(originalRequest);
      } catch (refreshErr: any) {
        isRefreshing = false;
        processQueue(refreshErr);
        
        // Only trigger logout if a DATA request failed and REFRESH also failed
        logoutHandler(); 
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);