import axios from "axios";

const be_url = import.meta.env.VITE_BE_URL;

// Create axios instance
const api = axios.create({
  baseURL: be_url,
  withCredentials: true,
});

// Track refresh attempts to prevent multiple simultaneous requests
let isRefreshing = false;
type RefreshSubscriber = (success: boolean) => void;
let refreshSubscribers: RefreshSubscriber[] = [];

// Auth event listeners for better integration with auth context
type AuthEventListener = () => void;
const authEventListeners: {
  logout: AuthEventListener[];
  tokenRefreshed: AuthEventListener[];
} = {
  logout: [],
  tokenRefreshed: [],
};

// Function to add auth event listeners
export const addAuthEventListener = (
  event: "logout" | "tokenRefreshed",
  listener: AuthEventListener
) => {
  authEventListeners[event].push(listener);
};

// Function to remove auth event listeners
export const removeAuthEventListener = (
  event: "logout" | "tokenRefreshed",
  listener: AuthEventListener
) => {
  const index = authEventListeners[event].indexOf(listener);
  if (index > -1) {
    authEventListeners[event].splice(index, 1);
  }
};

// Function to notify auth event listeners
const notifyAuthEventListeners = (event: "logout" | "tokenRefreshed") => {
  authEventListeners[event].forEach((listener) => listener());
};

// Function to refresh token using cookie-based approach
async function refreshAccessToken() {
  try {
    const response = await axios.post(
      `${be_url}/api/auth/refresh_my_token`,
      {},
      {
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      console.log("Token refreshed successfully");
      // Notify listeners that token was refreshed
      notifyAuthEventListeners("tokenRefreshed");
      return true;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);

    // Check if it's authentication related error
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as any).response?.status === "number" &&
      ((error as any).response.status === 401 ||
        (error as any).response.status === 404)
    ) {
      // Notify listeners that user should be logged out
      notifyAuthEventListeners("logout");
    }

    throw error;
  }
}

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Skip refresh for auth endpoints
      if (
        originalRequest.url?.includes("/api/auth/login") ||
        originalRequest.url?.includes("/api/auth/signup") ||
        originalRequest.url?.includes("/api/auth/refresh_my_token")
      ) {
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          await refreshAccessToken();

          // Notify all waiting requests that refresh is complete
          refreshSubscribers.forEach((callback) => callback(true));
          refreshSubscribers = [];

          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // Notify waiting requests that refresh failed
          refreshSubscribers.forEach((callback) => callback(false));
          refreshSubscribers = [];
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for ongoing refresh
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((success) => {
            if (success) {
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
