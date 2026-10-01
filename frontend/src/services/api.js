import axios from 'axios';

/**
 * Dynamically resolves the backend API base URL:
 * - On Cloudflare Tunnels (*.trycloudflare.com), ngrok, or mobile access:
 *   Routes via relative '/api/v1' to go through the dev server proxy without
 *   Mixed Content (HTTPS -> HTTP) or localhost-on-phone connection failures.
 * - On production builds (e.g. Vercel): Uses the configured remote API URL (e.g. Render).
 * - On local desktop development: Uses REACT_APP_API_URL or defaults to '/api/v1'.
 */
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const envApi = (process.env.REACT_APP_API_URL || '').trim();

    // If accessed through Cloudflare tunnel or external domain
    if (!isLocalhost && (
      hostname.includes('trycloudflare.com') ||
      hostname.includes('loca.lt') ||
      hostname.includes('ngrok')
    )) {
      if (envApi && !envApi.includes('localhost') && !envApi.includes('127.0.0.1')) {
        return envApi;
      }
      return '/api/v1';
    }

    // If page is loaded over HTTPS, block insecure HTTP localhost requests to prevent Mixed Content
    if (protocol === 'https:' && (envApi.startsWith('http://localhost') || envApi.startsWith('http://127.0.0.1'))) {
      return '/api/v1';
    }

    if (envApi) {
      return envApi;
    }

    return '/api/v1';
  }

  return process.env.REACT_APP_API_URL || '/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: attach Bearer token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: handle 401 ─────────────────────────────────────
// IMPORTANT: Only auto-redirect to /login if we are NOT on the login or
// register flow (i.e. the URL path is not an auth endpoint). This prevents
// swallowing errors during the login itself.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      // Don't auto-redirect during the login/register flow
      const isAuthFlow =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/me');

      if (!isAuthFlow) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
