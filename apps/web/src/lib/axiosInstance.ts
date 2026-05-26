/**
 * Axios instance with silent token refresh interceptor.
 *
 * When a 401 is received:
 *  1. A single refresh request is fired (concurrent requests are queued).
 *  2. On success, all queued requests are replayed.
 *  3. On failure, all queued requests are rejected and the auth event bus
 *     fires a "logout" event so AuthContext can clear state.
 */

import axios from "axios";
import { notifyAuthListeners } from "./authEvents";
import { VITE_BE_URL as BE_URL } from "../constants/e";

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: BE_URL,
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Token refresh machinery
// ---------------------------------------------------------------------------

let isRefreshing = false;
type RefreshSubscriber = (success: boolean) => void;
let refreshSubscribers: RefreshSubscriber[] = [];

async function refreshAccessToken(): Promise<void> {
  const response = await axios.post(
    `${BE_URL}/api/auth/refresh_my_token`,
    {},
    { withCredentials: true }
  );

  if (response.status === 200) {
    notifyAuthListeners("tokenRefreshed");
  }
}

// ---------------------------------------------------------------------------
// Request interceptor (pass-through — kept for future use)
// ---------------------------------------------------------------------------

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — silent token refresh on 401
// ---------------------------------------------------------------------------

const AUTH_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh_my_token",
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const is401 = error.response?.status === 401;
    const isRetry = originalRequest._retry === true;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) =>
      originalRequest.url?.includes(ep)
    );

    if (!is401 || isRetry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Queue this request until the in-progress refresh completes
      return new Promise((resolve, reject) => {
        refreshSubscribers.push((success) => {
          if (success) resolve(api(originalRequest));
          else reject(error);
        });
      });
    }

    isRefreshing = true;

    try {
      await refreshAccessToken();
      refreshSubscribers.forEach((cb) => cb(true));
      refreshSubscribers = [];
      return api(originalRequest);
    } catch (refreshError) {
      refreshSubscribers.forEach((cb) => cb(false));
      refreshSubscribers = [];
      notifyAuthListeners("logout");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
