// api.ts
import axios from "axios";
import type { AxiosRequestConfig } from "axios";

const be_url = import.meta.env.VITE_BE_URL;
const api = axios.create({
  baseURL: be_url,
  withCredentials: true, // send cookies automatically
});

let isRefreshing = false;
let queue: {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
  config: AxiosRequestConfig;
}[] = [];

function processQueue(
  error: unknown,
  config?: AxiosRequestConfig,
  token?: string
) {
  queue.forEach(({ resolve, reject, config: reqConfig }) => {
    if (error) {
      reject(error);
    } else {
      if (config && token) {
        // Optionally update header if cookie isn't used for auth header
        reqConfig.headers = {
          ...reqConfig.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      resolve(api(reqConfig));
    }
  });
  queue = [];
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (original.url?.includes("/refresh")) {
        // Refresh itself failed — must logout
        window.location.href = "/login";
        return Promise.reject(error);
      }

      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject, config: original });
        });
      }

      isRefreshing = true;

      return new Promise((resolve, reject) => {
        api
          .post("/refresh")
          .then((res) => {
            const newToken = res.data.accessToken;
            // If your server sets the cookie automatically, you don't need to store it
            // Optionally update Authorization header if you still use it
            processQueue(null, original, newToken);
            // Retry the original request
            resolve(api(original));
          })
          .catch((refreshError) => {
            processQueue(refreshError);
            window.location.href = "/login";
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
