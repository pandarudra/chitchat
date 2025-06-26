import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // send both token and refresh-token cookies
});

// Track if a refresh is in progress and queue failed requests
let isRefreshing = false;
const queue: {
  resolve: (token: void) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (err?: any) => {
  queue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve()));
  queue.length = 0;
};

// Interceptor catches 401 errors and retries with fresh token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retry) {
      config._retry = true;
      if (isRefreshing) {
        // new request: wait for active refresh to finish
        return new Promise((resolve, reject) =>
          queue.push({
            resolve: () => resolve(api(config)),
            reject: (e) => reject(e),
          })
        );
      }
      isRefreshing = true;
      try {
        await api.post("/api/auth/refresh_my_token"); // uses cookie `ref_token`
        processQueue();
        return api(config); // retry original
      } catch (e) {
        processQueue(e);
        // Optional: redirect to login
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
