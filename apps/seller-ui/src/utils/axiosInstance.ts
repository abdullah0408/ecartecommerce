import axios from 'axios';

/**
 * Create a reusable Axios instance with default configuration.
 * - baseURL: the backend URL from environment variable
 * - withCredentials: ensures cookies (like refresh tokens) are sent with requests
 */
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

/**
 * Flag to indicate whether a token refresh request is already in progress.
 * This prevents multiple simultaneous refresh requests when multiple requests fail with 401.
 */
let isRefreshing = false;

/**
 * Array of callbacks for requests that failed with 401 while a token refresh is in progress.
 * Each callback, when called, retries the original request and resolves its Promise.
 */
let refreshSubscribers: (() => void)[] = [];

/**
 * Handles user sign-out by redirecting to the sign-in page.
 * Called when token refresh fails or user is unauthorized.
 */
const handleSignOut = () => {
  if (window.location.pathname !== '/sign-in') {
    window.location.href = '/sign-in';
  }
};

/**
 * Adds a callback to the refreshSubscribers array.
 * These callbacks are called once the token refresh succeeds, allowing queued requests to retry.
 *
 * @param {() => void} callback - The function to call after refresh succeeds.
 */
const subscribeTokenRefresh = (callback: () => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Executes all queued callbacks after a successful token refresh.
 * Clears the array afterwards to prevent memory leaks.
 */
const onRefreshSuccess = () => {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

/**
 * Request interceptor for Axios.
 * Currently, it just returns the request config unchanged.
 * The interceptor could be used to add auth headers, logging, or other pre-request logic.
 */
axiosInstance.interceptors.request.use(
  (config) => config, // pass request config as-is
  (error) => Promise.reject(error) // forward request errors to caller
);

/**
 * Response interceptor for Axios.
 * Handles 401 Unauthorized responses and automatically refreshes the token if needed.
 */
axiosInstance.interceptors.response.use(
  (response) => response, // pass successful responses as-is
  async (error) => {
    const originalRequest = error.config;

    /**
     * Check if the error is a 401 Unauthorized and this request has not been retried yet.
     * This prevents infinite retry loops.
     */
    if (error.response.status === 401 && !originalRequest._retry) {
      /**
       * Case 1: Token refresh is already in progress
       * - Queue the current request in refreshSubscribers.
       * - Return a Promise that resolves once the refresh succeeds and the request is retried.
       */
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(axiosInstance(originalRequest)); // retry the original request
          });
        });
      }

      // Mark this request as already retried
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        /**
         * Case 2: No refresh in progress, so refresh the token now.
         * - Sends a POST request to the refresh-token endpoint.
         * - Assumes refresh token is stored in cookies (withCredentials: true).
         */
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/refresh-token`,
          {},
          { withCredentials: true }
        );

        isRefreshing = false;

        // Retry all requests queued while token was being refreshed
        onRefreshSuccess();

        // Retry the original request that triggered the refresh
        return axiosInstance(originalRequest);
      } catch (error) {
        /**
         * Token refresh failed
         * - Clear queued requests (they will never retry)
         * - Sign out the user
         * - Reject the Promise so original request sees the error in `.catch()`
         */
        isRefreshing = false;
        refreshSubscribers = [];
        handleSignOut();
        return Promise.reject(error);
      }
    }

    /**
     * Case 3: Error is not 401 or request already retried
     * - Just reject the Promise so the original caller’s `.catch()` runs
     */
    return Promise.reject(error);
  }
);

export default axiosInstance;
