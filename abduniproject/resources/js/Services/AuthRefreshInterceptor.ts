// AuthRefreshInterceptor — B.6 F-04/F-18 — Arena — single-flight 0-loop silent rotation — strict TS zero any
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({ withCredentials: true, headers: { Accept: 'application/json' } });

let isRefreshing = false;
type Q = { resolve: (v: string) => void; reject: (e: unknown) => void };
let failedQueue: Q[] = [];
const processQueue = (err: unknown, token: string | null): void => {
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token as string)));
  failedQueue = [];
};

// inject bearer if stored
let accessToken: string | null = null;
export const setAccessToken = (t: string | null): void => { accessToken = t; };
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) (config.headers as Record<string,string>).Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean; url?: string };
    // never intercept refresh endpoint itself — prevents infinite loop F-18
    if (original?.url?.includes('/auth/refresh')) return Promise.reject(error);
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then((tok) => {
            if (original.headers) (original.headers as Record<string,string>).Authorization = `Bearer ${tok}`;
            return api(original);
          });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const r = await api.post<{ access_token: string; expires_in: number }>(
          '/api/v1/auth/refresh',
          null,
          { withCredentials: true }
        );
        const newToken = r.data.access_token;
        setAccessToken(newToken);
        processQueue(null, newToken);
        if (original.headers) (original.headers as Record<string,string>).Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        // refresh expired/reuse — redirect once, clear token
        setAccessToken(null);
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
